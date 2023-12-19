const core = require('@actions/core');
const github = require('@actions/github');
const { fetch } = require('node-fetch');

(async () => {
  try{
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const githubToken = core.getInput('token_g', { required: true });
    const openIAToken = core.getInput('token_oia', { required: true });

    const octokit = new github.getOctokit(githubToken);

    const prInfo = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pr_number,
    });

    const diffURL = prInfo.data.diff_url;
    const response = await fetch(diffURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const diffText = await response.text();

    await octokit.rest.issues.createReview({
      owner,
      repo,
      pull_number: pr_number,
      body: "```diff\n"+`
        ${diffText}
      `+"\n```",
      event: 'COMMENT'
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();