const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try{
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const githubToken = core.getInput('token_g', { required: true });
    const openIAToken = core.getInput('token_oia', { required: true });

    const octokit = new github.getOctokit(token);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });

    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0
    };

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull Request #${pr_number} has been updated with: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n
        - ${githubToken} \n
        - ${openIAToken} \n
      `
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();