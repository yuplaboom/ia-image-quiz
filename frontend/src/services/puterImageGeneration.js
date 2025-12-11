/**
 * Load Puter.js from CDN if not already loaded
 */
async function loadPuterScript() {
  // Check if puter is already loaded
  if (window.puter) {
    return window.puter;
  }

  // Load script from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => {
      console.log('[Puter] Script loaded successfully');
      resolve(window.puter);
    };
    script.onerror = () => reject(new Error('Failed to load Puter.js'));
    document.head.appendChild(script);
  });
}

/**
 * Generate an image using Puter.js AI
 * @param {Object} participant - Participant object with traits
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export async function generateImageWithPuter(participant) {
  try {
    // Load Puter.js if needed
    const puter = await loadPuterScript();

    // Initialize Puter if not already done
    if (!puter.auth?.isSignedIn) {
      await puter.auth.signIn({ stay_logged_in: false });
    }

    // Build the prompt from participant data
    const prompt = buildPrompt(participant);

    console.log('[Puter] Generating image with prompt:', prompt);

    // Generate image using Puter AI
    const image = await puter.ai.txt2img(prompt);

    // Convert image element to base64 data URL
    const dataUrl = await imageElementToDataURL(image);

    console.log('[Puter] Image generated successfully');
    return dataUrl;
  } catch (error) {
    console.error('[Puter] Error generating image:', error);
    throw error;
  }
}

/**
 * Build prompt from participant data
 */
function buildPrompt(participant) {
  const { name, physicalTraits, flaw, quality, jobTitle } = participant;
  const traitsText = Array.isArray(physicalTraits) ? physicalTraits.join(', ') : '';

  return `
  Ambiance de repas de Noël, au premier plan une personne (style réel) prénommée ${name} (mais sans afficher le prénom), 
avec les traits physiques suivants : ${traitsText}. Elle est habillée et entourée d’objets correspondant au travail d’une ${jobTitle}. Elle a l’air un peu ${flaw}, mais est urtout très ${quality} et bienveillante.`;
}

/**
 * Convert image element to data URL
 */
function imageElementToDataURL(imageElement) {
  return new Promise((resolve, reject) => {
    // If it's already a data URL or regular URL, use it directly
    if (typeof imageElement === 'string') {
      resolve(imageElement);
      return;
    }

    // If it's an image element, convert it to canvas then to data URL
    if (imageElement instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width || imageElement.naturalWidth;
      canvas.height = imageElement.height || imageElement.naturalHeight;

      const ctx = canvas.getContext('2d');

      // Wait for image to load if not already loaded
      if (!imageElement.complete) {
        imageElement.onload = () => {
          ctx.drawImage(imageElement, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        imageElement.onerror = reject;
      } else {
        ctx.drawImage(imageElement, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
    } else {
      reject(new Error('Unsupported image type'));
    }
  });
}

/**
 * Generate images for multiple participants
 */
export async function generateImagesForParticipants(participants, onProgress) {
  const results = [];

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];

    try {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: participants.length,
          participant: participant.name,
          status: 'generating'
        });
      }

      const imageDataUrl = await generateImageWithPuter(participant);

      results.push({
        participantId: participant.id,
        imageDataUrl,
        success: true
      });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: participants.length,
          participant: participant.name,
          status: 'completed'
        });
      }
    } catch (error) {
      console.error(`[Puter] Failed to generate image for ${participant.name}:`, error);

      results.push({
        participantId: participant.id,
        imageDataUrl: null,
        success: false,
        error: error.message
      });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: participants.length,
          participant: participant.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  return results;
}