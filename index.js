const core = require('@actions/core');
const github = require('@actions/github');
const { parsePatch } = require('diff');

const ClearDiff = require('./helpers/ClearDiff');
const CaptureDiffMetaData = require('./helpers/CaptureDiffMetaData');
const GenerateBodyReview = require('./helpers/GenerateBodyReview');

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

    const ignoredPaths = ['dist', 'package-lock.json'];
    
    const diffFiltrado = ClearDiff(diffPR, ignoredPaths);
    const diffData = CaptureDiffMetaData(changedFiles);

    console.log(diffFiltrado);

    const patches = parsePatch(diffPR);
    const fileDiffs = patches.map(patch => {
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
    console.log('fileDiffs', fileDiffs);

    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr_number,
      commit_id: commitID,
      body: GenerateBodyReview({pr_number, diffData, diffFiltrado}),
      event: 'COMMENT',
      comments: [
        {
          path: 'package.json',
          position: 1,
          body: 'This is a comment on a line',
        }
      ]
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();