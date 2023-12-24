const core = require('@actions/core');
const github = require('@actions/github');

const ClearDiff = require('./helpers/ClearDiff');
const CaptureDiffMetaData = require('./helpers/CaptureDiffMetaData');

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

    const ignoredPaths = ['dist', 'package-lock.json'];
    const diffFiltrado = ClearDiff(diffPR, ignoredPaths);
    const diffData = CaptureDiffMetaData(changedFiles);

    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr_number,
      body: GenerateBodyReview({pr_number, diffData, diffFiltrado}),
      event: 'COMMENT'
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();