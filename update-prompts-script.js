const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yxxdgcqxaihevlrhrtbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGRnY3F4YWloZXZscmhydGJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc4MzQxOCwiZXhwIjoyMDUwMzU5NDE4fQ.wDLfYH3MtE0vSj7LTLcT5iJgP4Mu_1LigJr6GtZOSYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePrompts() {
  console.log('🔄 Обновление промптов ByteDance...');

  const updates = [
    {
      model: 'bytedance',
      intensity: 'pretty',
      environment: null,
      prompt_text: 'Make this woman naturally more beautiful. CRITICAL: Preserve exact facial features - same face shape, nose, lips, eyes, eyebrows, jawline. Keep her identity intact. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions identical to original. Skin must look like real human skin, not plastic or overly smooth. Keep body proportions. Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.'
    },
    {
      model: 'bytedance',
      intensity: 'hot',
      environment: 'original',
      prompt_text: 'Transform this woman into a stunningly attractive version of herself. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows, chin. Identity must remain identical. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality identical. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. make this woman sexy, work with outfit to show tits and mark body lines'
    },
    {
      model: 'bytedance',
      intensity: 'hot',
      environment: 'home',
      prompt_text: 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. CRITICAL: Preserve exact same face - same face shape, nose, lips, eyes, eyebrows. Keep identity intact. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical to original. Photorealistic result with natural human skin texture.'
    },
    {
      model: 'bytedance',
      intensity: 'hot',
      environment: 'bathtub',
      prompt_text: 'Transform this woman into a stunningly attractive version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows. Identity must stay identical. IMPORTANT: человек не должен находитсья в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчерни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. . IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical. Photorealistic result with natural human skin texture.'
    },
    {
      model: 'bytedance',
      intensity: 'hot',
      environment: 'bedroom',
      prompt_text: 'Transform this woman into a stunningly attractive version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. CRITICAL: Preserve exact face - same face shape, nose, lips, eyes, eyebrows. Keep identity intact. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical to original. Photorealistic result with natural human skin texture.'
    },
    {
      model: 'bytedance',
      intensity: 'hot',
      environment: 'office',
      prompt_text: 'Transform this woman into a stunningly attractive version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows, chin. Identity must remain identical. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical. Photorealistic result with natural human skin texture.'
    }
  ];

  for (const update of updates) {
    const { model, intensity, environment, prompt_text } = update;
    
    // Создаем условие для WHERE
    const match = { model, intensity };
    if (environment === null) {
      match.environment = null;
    } else {
      match.environment = environment;
    }
    
    const { error } = await supabase
      .from('prompts')
      .update({ 
        prompt_text,
        updated_at: new Date().toISOString()
      })
      .match(match);

    if (error) {
      console.error(`❌ Ошибка обновления промпта ${model}/${intensity}/${environment}:`, error);
    } else {
      console.log(`✅ Обновлен промпт: ${model}/${intensity}/${environment || 'null'}`);
    }
  }

  console.log('✨ Промпты обновлены!');
}

updatePrompts().catch(console.error);
