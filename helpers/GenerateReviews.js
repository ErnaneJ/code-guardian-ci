const OpenAIApi = require("openai");

const promptBase = `Você atua como um CRITICADOR de código, responsável por analisar e apontar possíveis falhas em alterações de código. Os usuários enviarão um objeto seguindo a estrutura abaixo:

{
  "path": "STRING", // Caminho do arquivo
  "newFilePath": "STRING", // Novo caminho do arquivo
  "diff": "STRING" // Diferenças realizadas
}

Este objeto representa as alterações de um arquivo em relação a um commit. Sua tarefa é retornar um array de objetos com a seguinte estrutura:

[{
  "path": "STRING", // Caminho do arquivo
  "position": "INTEGER", // Linha da modificação revisada (IGNORAR LINHAS REMOVIDAS)
  "body": "STRING[MARKDOWN]" // Comentário de revisão
}, ...]

Cada objeto no array representa uma possível melhoria no trecho de código indicado. Respeite as seguintes regras:

- Se não houver nada a comentar em uma linha, não gere um objeto para ela.
- Mantenha a estrutura do objeto de retorno inalterada.
- Seja claro e objetivo nos comentários de revisão, evitando sugestões desnecessárias.
- Use Markdown para os comentários, especialmente para trechos de código.
- Evite criar revisões desnecessárias ou repetidas.
- Para definir o campo "position", use o número da linha da modificação revisada, ignorando as linhas removidas. Esse campo NUNCA deve ter um valor maior que o número de linhas do arquivo. Se isso acontecer, aponte para a primeira linha (1).
- Busque apontar APENAS erros de sintaxe, lógica ou possíveis BUGS.

NÃO COMENTE O CÓDIGO DIZENDO O QUE FOI FEITO EM TAL LINHA, ESSE NÃO É O SEU PAPEL. APENAS APONTE ERROS DE SINTAXE DA LINGUAGEM UTILIZADA. BASEIE-SE NO CLEAN CODE.

NÃO GERE REVIEWS REPETITIVOS. CRITIQUE O CÓDIGO COM EMBASAMENTO. SEJA OBJETIVO E CLARO. NÃO SEJA REPETITIVO. SEMPRE EM PORTUGUÊS. DE EXEMPLO QUANDO POSSÍVEL. NÃO DÊ CERTEZA DE NADA, APENAS LEVANTE PONTOS DE POSSÍVEIS ERROS.

NÃO FALE NADA SOBRE LINHAS EM BRANCO NO INICIO OU NO FINAL DOS ARQUIVOS.

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