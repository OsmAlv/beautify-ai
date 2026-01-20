-- Обновить промпты для ByteDance с улучшенным сохранением лица

-- ByteDance Pretty
UPDATE prompts 
SET prompt_text = 'Make this woman naturally more beautiful. CRITICAL: Preserve exact facial features - same face shape, nose, lips, eyes, eyebrows, jawline. Keep her identity intact. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions identical to original. Skin must look like real human skin, not plastic or overly smooth. Keep body proportions. Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'pretty' AND environment IS NULL;

-- ByteDance Hot Original
UPDATE prompts 
SET prompt_text = 'Transform this woman into a stunningly attractive version of herself. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows, chin. Identity must remain identical. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality identical. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. make this woman sexy, work with outfit to show tits and mark body lines',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'hot' AND environment = 'original';

-- ByteDance Hot Home
UPDATE prompts 
SET prompt_text = 'Transform this woman into a stunningly attractive version of herself в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. CRITICAL: Preserve exact same face - same face shape, nose, lips, eyes, eyebrows. Keep identity intact. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical to original. Photorealistic result with natural human skin texture.',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'hot' AND environment = 'home';

-- ByteDance Hot Bathtub
UPDATE prompts 
SET prompt_text = 'Transform this woman into a stunningly attractive version of herself в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows. Identity must stay identical. IMPORTANT: человек не должен находитсья в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчерни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. . IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical. Photorealistic result with natural human skin texture.',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'hot' AND environment = 'bathtub';

-- ByteDance Hot Bedroom
UPDATE prompts 
SET prompt_text = 'Transform this woman into a stunningly attractive version of herself в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. CRITICAL: Preserve exact face - same face shape, nose, lips, eyes, eyebrows. Keep identity intact. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical to original. Photorealistic result with natural human skin texture.',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'hot' AND environment = 'bedroom';

-- ByteDance Hot Office
UPDATE prompts 
SET prompt_text = 'Transform this woman into a stunningly attractive version of herself в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. CRITICAL: Keep exact same face - preserve face shape, nose, lips, eyes, eyebrows, chin. Identity must remain identical. Убери любые предметы из рук и с шеи.. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality identical. Photorealistic result with natural human skin texture.',
    updated_at = NOW()
WHERE model = 'bytedance' AND intensity = 'hot' AND environment = 'office';
