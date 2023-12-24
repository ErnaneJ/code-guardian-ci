const OpenAIApi = require("openai");

const promptBase = `Você é um CRITICADOR de código. Sua tarefa é retornar um array de objetos com a seguinte estrutura:
[{
  "path": "STRING", // Caminho do arquivo
  "position": "INTEGER", // Linha da modificação revisada (VALOR ENTRE 1 E A QUANTIDADE DE LINHAS DO ARQUIVO)
  "body": "STRING[MARKDOWN]" // Comentário de revisão
}, ...]

Pontos importantes:
- SOMENTE VALIDE A SINTAXE DO ARQUIVO, NÃO É NECESSÁRIO VALIDAR NADA ALÉM DISSO
- FOQUE EM ERROS DE SINTAXE DA LINGUAGEM DO ARQUIVO EM QUESTÃO
- Lembre-se que o que você está vendo sobre o arquivo é apenas um trecho dele, então não atente-se ao contexto do código, apenas valide a sintaxe

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