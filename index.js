const core = require('@actions/core');
const github = require('@actions/github');
const { parsePatch } = require('diff');

const CaptureDiffMetaData = require('./helpers/CaptureDiffMetaData');
const GenerateBodyReview = require('./helpers/GenerateBodyReview');
const GenerateCodeReview = require('./helpers/GenerateReviews');

(async () => {
  try{
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const githubToken = core.getInput('token_g', { required: true });
    const openIAToken = core.getInput('token_oia', { required: true });

    const octokit = new github.getOctokit(githubToken);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner, repo, pull_number: pr_number,
    });

    const { data: diffPR } = await octokit.rest.pulls.get({
      owner, repo, pull_number: pr_number,
      mediaType: { format: 'diff' }
    });

    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner, repo, pull_number: pr_number,
    });

    const commitID = pullRequest.head.sha;

    const diffData = CaptureDiffMetaData(changedFiles);
    
    const ignoredPaths = ['dist', 'package-lock.json', 'package.json', '.github/workflows/code-guardian-ci.yaml'];
    const patches = parsePatch(diffPR);
    const rawFileDiffs = patches.map(patch => {
      const isFileRemoved = patch.oldFileName === '/dev/null';
      const isFileAdded = patch.newFileName === '/dev/null';
  
      return {
        path: isFileRemoved ? patch.newFileName : patch.oldFileName,
        newFilePath: patch.newFileName,
        diff: patch.hunks.map(hunk => hunk.lines.join('\n')).join('\n'),
        isFileAdded,
        isFileRemoved,
      };
    });
    const fileDiffs = rawFileDiffs.filter(fileDiff => {
      fileDiff.path = fileDiff.path.replace(/^((a|b)\/)+/g, '');
      return !ignoredPaths.some(ignoredPath => {
        return fileDiff.path.startsWith(ignoredPath) || fileDiff.path.startsWith('/' + ignoredPath) 
      });
    });

    let comments = await GenerateCodeReview(fileDiffs, openIAToken, "gpt-3.5-turbo");
    comments = comments.flat();
    comments = comments.map(comment => {
      const position = parseInt(comment.position);
      const path = comment.path.replace(/^((a|b)\/)+/g, '');
      console.log(comment.path, '=>', path);
      return {
        ...comment,
        path: path,
        position: isNaN(position) ? 1 : position,
      }
    })
    console.log("=====================================")
    console.log(comments)
    console.log("=====================================")
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr_number,
      commit_id: commitID,
      body: GenerateBodyReview({pr_number, diffData, diffFiltrado: '...'}),
      event: 'COMMENT',
      comments: comments.flat()
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();