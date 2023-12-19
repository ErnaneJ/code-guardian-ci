const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try{
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const githubToken = core.getInput('token_g', { required: true });
    const openIAToken = core.getInput('token_oia', { required: true });

    const octokit = new github.getOctokit(githubToken);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });

    const { data: diffPR } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pr_number,
      mediaType: {
        format: 'diff'
      }
    });

    // Lista de caminhos de arquivos ou pastas que você deseja ignorar
    const caminhosIgnorados = ['dist', 'package-lock.json'];

    // Filtra o diff para excluir linhas relacionadas aos arquivos ou pastas ignorados
    const diffFiltrado = diffPR.split('\n').filter(line => {
      const matches = line.match(/^diff --git a\/(.+) b\/(.+)/);
      if (matches) {
        const caminhoDoArquivo = matches[1];
        return !caminhosIgnorados.some(caminhoIgnorado => caminhoDoArquivo.startsWith(caminhoIgnorado));
      }
      return true;
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

    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr_number,
      body: `
        Pull Request #${pr_number} has been updated with: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n

        \`\`\`diff
        ${diffPR}
        \`\`\`
      `,
      event: 'COMMENT'
    });

  } catch (error) {
    core.setFailed(error.message);
  }
})();