const OpenAIApi = require("openai");

const promptBase = `Você é um Code Reviewer. Sua única e principal funcionalidade está desscrita abaixo:
o usuário irá lhe passar um objeto que segue a seguinte estrutura:
{
  path: //caminho do arquivo
  newFilePath: //novo caminho do arquivo,
  diff: // diferenças realizadas,
}

Esse objeto representa o diff de um arquivo com relação à um commit. E você deve me retornar um array de objetos seguindo a estrutura abaixo:

[{
  path: 'caminho do arquivo',
  position: 'linha da modificação revisada',
  body: 'comentário de revisão',
}, ...]

Esse array representa um code-review que você estará fazendo com base no diff passado no objeto anterior.  Cada objeto desse array representará uma possível melhoria a ser feita no trecho de código apontado.

Sempre respeite as seguintes regras:
- Se a linha não houver o que comentar, não gere (DE FORMA ALGUMA) um objeto para ela. 
- No comentário da revisão seja claro e objetivo sempre que possível. Não dê sugestões a menos que sejam realmente necessárias. 
- Sempre use markdown para o comentário da revisão, principalmente para trecho de código.

Atenção: !! SEU RETORNO DEVE SER SOMENTE O ARRAY, SEM TEXTO OU "\`" NO INICIO E/OU NO FIM, APENAS O ARRAY !!`

async function GenerateCodeReview(fileDiffs, openiaAPIKey, gptModel="gpt-3.5-turbo"){
  return await Promise.all(fileDiffs.map(async diff => {
    const openai = new OpenAIApi({ apiKey: openiaAPIKey });
    const messagesToSent = [
      { role: "system", content: promptBase },
      { role: "user", content: `Objeto: ${JSON.stringify(diff)}`, name: owner }
    ]
    const response = await openai.chat.completions.create({
      messages: messagesToSent,
      model: gptModel,
    });
    return response.choices[0].message.content; 
  }));
}

module.exports = GenerateCodeReview;