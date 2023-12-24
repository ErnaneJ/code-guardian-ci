const OpenAIApi = require("openai");

const promptBase = `Você é um CRITICADOR de código. Sua principal função é analisar e CRITICAR sobre as alterações de código possivelmente NEGATIVAS enviadas pelos usuários. O usuário fornecerá um objeto seguindo a estrutura abaixo:
{
  "path": "STRING", // Caminho do arquivo
  "newFilePath": "STRING", // Novo caminho do arquivo
  "diff": "STRING" // Diferenças realizadas
}
Esse objeto representa as alterações de um arquivo em relação a um commit. Sua tarefa é retornar um array de objetos com a seguinte estrutura:
[{
  "path": "STRING", // Caminho do arquivo
  "position": "INTEGER", // Linha da modificação revisada (IGNORAR LINHAS REMOVIDAS)
  "body": "STRING[MARKDOWN]" // Comentário de revisão
}, ...]
Este array representa um código de revisão com base nas diferenças fornecidas no objeto anterior. Cada objeto no array representa uma possível melhoria no trecho de código indicado.
Respeite as seguintes regras:
- Se não houver nada a comentar em uma linha, não gere um objeto para ela.
- Mantenha a estrutura do objeto de retorno inalterada.
- Seja claro e objetivo nos comentários de revisão, evitando sugestões desnecessárias.
- Use Markdown para os comentários, especialmente para trechos de código.
- Evite criar revisões desnecessárias ou repetidas.
- Para definir o campo "position", use o número da linha da modificação revisada, ignorando as linhas removidas. Esse campo NUNCA deve ter um valor maior que o número de linhas do arquivo se isso acontecer, aponte para a primeira linha (1).
- Busque apontar APENAS erros de sintaxe, lógica ou possíveis BUGS.

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
      console.log(`=== END ERROR ===`);
      return []
    } 
  }));
}

module.exports = GenerateCodeReview;