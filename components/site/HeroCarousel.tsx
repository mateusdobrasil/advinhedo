"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function HeroCarousel({ fallbackImage }: { fallbackImage: string }) {
  const [bannersDB, setBannersDB] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bannerAtual, setBannerAtual] = useState(0);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function buscarBanners() {
      const hoje = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("banners")
        .select("*")
        .gte("data_fim", hoje)
        .lte("data_inicio", hoje)
        .order("data_inicio", { ascending: true });

      if (data && data.length > 0) {
        setBannersDB(data);
      }
      setCarregando(false);
    }
    buscarBanners();
  }, [supabase]);

  // Temporizador do Carrossel
  useEffect(() => {
    if (bannersDB.length <= 1) return;
    const intervalo = setInterval(() => {
      setBannerAtual((prev) => (prev === bannersDB.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalo);
  }, [bannersDB.length]);

  // Fallback: Se estiver a carregar ou não houver banners ativos, mostra a imagem padrão
  if (carregando || bannersDB.length === 0) {
    return (
      <div className="relative w-full aspect-video overflow-hidden rounded-3xl border border-sand/15 shadow-soft">
        <Image
          src={fallbackImage}
          alt="Templo AD Vinhedo"
          fill
          priority
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      
      {/* 1. Área da Imagem (Agora com aspect-video para garantir a altura da imagem) */}
      <div className="relative w-full aspect-video overflow-hidden rounded-3xl border border-sand/15 bg-midnight-soft/30 shadow-inner">
        {bannersDB.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === bannerAtual ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"
            }`}
          >
            <Image
              src={banner.imagem_url}
              alt={banner.titulo}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Controles do Carrossel (Bolinhas) */}
        {bannersDB.length > 1 && (
          <div className="absolute bottom-3 right-3 z-20 flex gap-1.5 bg-midnight/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
            {bannersDB.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setBannerAtual(idx)}
                aria-label={`Ver slide ${idx + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === bannerAtual ? "bg-gold w-5" : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Área do Título */}
      <div className="mt-5 text-center px-2 animate-rise">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold-light opacity-80 mb-1">
          Próximo Evento
        </span>
        <p className="text-white font-display text-xl sm:text-2xl leading-tight">
          {bannersDB[bannerAtual]?.titulo}
        </p>
      </div>
    </div>
  );
}