"use client";

import { useState } from "react";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Please enter your Replicate API Token");
      return;
    }
    if (!file) {
      setError("Please upload an image");
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: {
          "X-Replicate-Token": apiKey,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate image");
      }

      if (data.image_url) {
        setResultUrl(data.image_url);
      } else if (data.result && Array.isArray(data.result)) {
        setResultUrl(data.result[0]);
      } else {
        setResultUrl(data.result);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500 selection:text-white overflow-hidden relative">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">

        {/* Header */}
        <header className="text-center mb-16 relative z-10 animate-fade-in-up">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-purple-300">
            AI Magic Studio
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Turn Photos into <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              3D Illustrations
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Upload a photo of your child and watch our AI transform it into a stunning, personalized 3D character in seconds.
          </p>
        </header>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Controls Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative z-10 space-y-8">
              {/* API Key Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 ml-1">Replicate API Token</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="r8_..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.636 11.364 11.364 9.636 11.536 6.343 4.828 4.828 6.343 11.536 9.636 9.636 11.536 11.364 11.364 9.636 13.257 5.257A6 6 0 0121 9z"></path></svg>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 ml-1">Reference Photo</label>
                <div className="relative group/upload">
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${file ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    {preview ? (
                      <div className="relative w-full aspect-square md:aspect-[4/3] rounded-lg overflow-hidden shadow-lg mx-auto max-w-[200px]">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div className="text-gray-400 text-sm">
                          <span className="text-purple-400 font-medium">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-600">JPG, PNG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !file || !apiKey}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform active:scale-[0.98] ${loading || !file || !apiKey
                    ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/25 ring-1 ring-white/10"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Dreaming up details...
                  </span>
                ) : (
                  "Generate Magic"
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Result Card */}
          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl transition-all duration-500 ${resultUrl ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 relative group">
              {resultUrl ? (
                <>
                  <img src={resultUrl} alt="Result" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <a
                      href={resultUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-white text-black font-bold rounded-xl text-center hover:bg-gray-100 transition-colors"
                    >
                      Download Masterpiece
                    </a>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  {loading ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-medium animate-pulse">This might take a minute...</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                        <span className="text-3xl">✨</span>
                      </div>
                      <p className="text-sm">Your creation will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
