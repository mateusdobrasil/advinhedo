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

  // Se estiver carregando ou não houver banners ativos, mostra a imagem padrão do Templo
  if (carregando || bannersDB.length === 0) {
    return (
      <Image
        src={fallbackImage}
        alt="Templo"
        fill
        priority
        className="object-cover"
      />
    );
  }

  return (
    <>
      {bannersDB.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === bannerAtual ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={banner.imagem_url}
            alt={banner.titulo}
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Sombra suave para o texto do banner ficar legível se necessário */}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-deep/80 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-10 left-0 w-full text-center px-4">
            <p className="text-white font-display text-xl sm:text-2xl drop-shadow-lg">{banner.titulo}</p>
          </div>
        </div>
      ))}

      {/* Controles do Carrossel */}
      {bannersDB.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-midnight/30 backdrop-blur-md px-3 py-1.5 rounded-full">
          {bannersDB.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setBannerAtual(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === bannerAtual ? "bg-gold w-5" : "bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}