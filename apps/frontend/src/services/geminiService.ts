import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set safely.
  // We handle the case where key might be missing gracefully in UI.
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateVendorDescription = async (
  vendorName: string,
  category: string,
  city: string,
  keywords: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key not found, returning mock description.");
    return `Welcome to ${vendorName}, the premier destination for ${category} in ${city}. We pride ourselves on quality and service. (AI Generation Unavailable)`;
  }

  try {
    const prompt = `Write a luxurious, elegant, and professional business description (about 80 words) for a vendor named "${vendorName}" located in ${city}. They specialize in ${category}. Key highlights: ${keywords}. Focus on trust, quality, and heritage.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Description generation failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again later.";
  }
};