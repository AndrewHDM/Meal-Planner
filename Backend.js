export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { imageData, filename } = await request.json();
      if (!imageData) {
        return json({ error: 'Missing imageData' }, 400);
      }

      const prompt = `You are extracting a cooking recipe from a photo.
Return strict JSON only with keys:
- title (string)
- ingredients (array of objects: section, amount, unit, item)
- instructions (string)
- tags (array of strings)

Rules:
- Use grocery-store friendly ingredient names.
- section must be one of: Produce, Meat/Seafood, Dairy, Pantry, Frozen.
- If uncertain, use Pantry.
- If something is missing, return empty string/array instead of hallucinating.`;

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: `Filename: ${filename || 'unknown'}. ${prompt}` },
                { type: 'input_image', image_url: imageData }
              ]
            }
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'recipe_extract',
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  instructions: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  ingredients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        section: {
                          type: 'string',
                          enum: ['Produce', 'Meat/Seafood', 'Dairy', 'Pantry', 'Frozen']
                        },
                        amount: { type: 'number' },
                        unit: { type: 'string' },
                        item: { type: 'string' }
                      },
                      required: ['section', 'amount', 'unit', 'item']
                    }
                  }
                },
                required: ['title', 'ingredients', 'instructions', 'tags']
              }
            }
          }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        return json({ error: text }, 502);
      }

      const data = await response.json();
      const output = data.output_text ? JSON.parse(data.output_text) : {
        title: '',
        ingredients: [],
        instructions: '',
        tags: []
      };

      return json(output, 200);
    } catch (err) {
      return json({ error: err.message || 'Extraction failed' }, 500);
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
