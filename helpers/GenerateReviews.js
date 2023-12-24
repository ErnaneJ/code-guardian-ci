const OpenAIApi = require("openai");

// only for testing
const promptBase = `You are a code CRITICITOR. Its task is to return an array of objects with the following structure:
[{
  "path": "STRING", // File path
  "position": "INTEGER", // Revised modification line (VALUE BETWEEN 1 AND THE NUMBER OF LINES IN THE FILE)
  "body": "STRING[MARKDOWN]" // Review comment
}, ...]

Important points:
- ONLY VALIDATE THE FILE SYNTAX, IT IS NOT NECESSARY TO VALIDATE ANYTHING BEYOND THAT
- FOCUS ON SYNTAX ERRORS IN THE LANGUAGE OF THE FILE IN QUESTION
- Remember that what you are seeing about the file is just a snippet of it, so don't pay attention to the context of the code, just validate the syntax

ATTENTION: YOUR RETURN MUST BE JUST THE ARRAY IN JSON.STRINGIFY FORMAT, WITHOUT TEXT OR "\`" AT THE BEGINNING OR END, JUST THE ARRAY.`

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