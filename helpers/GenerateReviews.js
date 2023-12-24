const OpenAIApi = require("openai");

const promptBase = `Você é um CRITICADOR de código. Sua tarefa é retornar um array de objetos com a seguinte estrutura:
[{
  "path": "STRING", // Caminho do arquivo
  "position": "INTEGER", // Linha da modificação revisada (VALOR ENTRE 1 E A QUANTIDADE DE LINHAS DO ARQUIVO)
  "body": "STRING[MARKDOWN]" // Comentário de revisão
}, ...]

Pontos importantes:
- Não retorne mais de 10 elementos no array
- Não crie review sobre sugestões, apenas sobre erros
- Não comente nada sobre o código que não seja um erro
- Não comente sobre adicionar ou remover linhas em branco
- FOQUE EM ERROS DE SINTAXE DA LINGUAGEM DO ARQUIVO EM QUESTÃO

Cada elemento do array representa um possível erro encontrado por você no diff enviado. Você pode retornar quantos elementos quiser, mas lembre-se que o objetivo é retornar apenas os erros importantes.

ATENÇÃO: SEU RETORNO DEVE SER APENAS O ARRAY NO FORMATO JSON.STRINGIFY, SEM TEXTO OU "\`" NO INÍCIO OU NO FINAL, APENAS O ARRAY.`

async function GenerateCodeReview(fileDiffs, openiaAPIKey, gptModel="gpt-3.5-turbo"){
  return await Promise.all(fileDiffs.map(async diff => {
    const openai = new OpenAIApi({ apiKey: openiaAPIKey });
    const messagesToSent = [
      { role: "system", content: promptBase },
      { role: "user", content: `${JSON.stringify(diff)}` }
    ]
    const response = await openai.chat.completions.create({
      messages: messagesToSent,
      model: gptModel,
    });
    try{
      return JSON.parse(response.choices[0].message.content);
    }catch(e){
      console.log(`=== ERROR [${ diff.path }] ===`);
      console.log(response.choices[0].message.content);
      console.log(e);
      console.log(`=== END ERROR ===`);
      return []
    } 
  }));
}

module.exports = GenerateCodeReview;