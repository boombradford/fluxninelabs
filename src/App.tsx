import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function App() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="bg-[#000000] text-white min-h-screen font-sans">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-[#000000]/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-[52px]">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="https://dxzigvsnwmwhwgwg.public.blob.vercel-storage.com/flux-logo-rounded.webp" alt="Flux Nine Labs" className="h-7 w-7 rounded-lg shadow-sm" />
              <span className="text-[17px] font-extrabold tracking-tight">Flux Nine Labs</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-[14px] font-bold">
              <a href="#work" className="hover:text-white/60 transition-colors">
                Work
              </a>
              <a href="#services" className="hover:text-white/60 transition-colors">
                Services
              </a>
              <a href="#about" className="hover:text-white/60 transition-colors">
                About
              </a>
              <Button
                size="sm"
                className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-4 h-8 text-[12px] transition-all focus-apple"
              >
                Get in Touch
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[52px]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40">
            <source src="https://dxzigvsnwmwhwgwg.public.blob.vercel-storage.com/grok-video-929da915-4b03-4fd3-b03e-8652f392d36d%20%281%29.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-[980px] py-32">
          <h1 className="text-[48px] md:text-[64px] lg:text-[80px] font-bold mb-6 leading-[1.05] tracking-[-0.015em] text-balance">
            Stories that move the world
          </h1>
          <p className="text-[21px] md:text-[24px] text-white/70 max-w-[600px] mx-auto leading-[1.4] font-normal mb-12">
            We create cinematic experiences that captivate audiences and elevate brands.
          </p>
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 text-[17px] font-medium h-12 transition-all focus-apple"
              asChild
            >
              <a href="http://www.youtube.com/@wavereact" target="_blank" rel="noopener noreferrer">
                View Our Work
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-6">
        <div className="h-px bg-white/10" />
      </div>

      <section id="work" className="py-16 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="mb-16">
            <p className="text-[12px] text-white/50 font-semibold mb-3 tracking-wide uppercase">Featured Work</p>
            <h2 className="text-[40px] md:text-[48px] font-bold tracking-[-0.015em] mb-4">Our Best Work</h2>
            <p className="text-[19px] md:text-[21px] text-white/70 max-w-[600px] leading-[1.4]">
              Award-winning projects showcasing exceptional storytelling.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="group relative aspect-[16/9] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/xCdDZfRVKzw"
                title="Featured Project"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:border-white/20">
                <div className="aspect-[4/3] overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/9GpNL7HS_qQ"
                    title="Recent Work"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-6">
                  <p className="text-[12px] font-semibold text-white/50 uppercase mb-2">Recent</p>
                  <h3 className="text-[24px] font-semibold tracking-[-0.01em] mb-2">Latest Project</h3>
                  <p className="text-[15px] text-white/60">Showcasing our newest work</p>
                </div>
              </div>

              <div className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:border-white/20">
                <div className="aspect-[4/3] overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/uQWPKNEUN_U"
                    title="Client Work"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-6">
                  <p className="text-[12px] font-semibold text-white/50 uppercase mb-2">Portfolio</p>
                  <h3 className="text-[24px] font-semibold tracking-[-0.01em] mb-2">Client Work</h3>
                  <p className="text-[15px] text-white/60">Trusted by leading brands</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-6">
        <div className="h-px bg-white/10" />
      </div>

      <section id="services" className="py-16 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="mb-16">
            <p className="text-[12px] text-white/50 font-semibold mb-3 tracking-wide uppercase">What We Do</p>
            <h2 className="text-[40px] md:text-[48px] font-bold tracking-[-0.015em] mb-4">Our Services</h2>
            <p className="text-[19px] md:text-[21px] text-white/70 max-w-[600px] leading-[1.4]">
              Comprehensive video production services tailored to your vision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Commercial Production",
                desc: "High-end video content for brands that demand excellence.",
              },
              {
                title: "Brand Storytelling",
                desc: "Narrative-driven films that connect emotionally with audiences.",
              },
              {
                title: "Post-Production",
                desc: "Masterful editing and color grading that elevates your content.",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="group cursor-pointer bg-white/[0.03] rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all"
              >
                <h3 className="text-[24px] font-semibold mb-4 tracking-[-0.01em]">{service.title}</h3>
                <p className="text-[17px] text-white/70 leading-[1.4]">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-6">
        <div className="h-px bg-white/10" />
      </div>

      <section id="about" className="py-16 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[12px] text-white/50 font-semibold mb-3 tracking-wide uppercase">About Us</p>
              <h2 className="text-[40px] md:text-[48px] font-bold tracking-[-0.015em] mb-6">
                Crafting Stories That Matter
              </h2>
              <div className="space-y-6 text-[17px] md:text-[19px] text-white/70 leading-[1.5]">
                <p>
                  We are a collective of filmmakers and creative visionaries dedicated to pushing the boundaries of
                  visual storytelling.
                </p>
                <p>
                  With over a decade of experience, we bring technical excellence and artistic vision to every project.
                </p>
              </div>
              <Button
                size="lg"
                className="mt-8 bg-white text-black hover:bg-white/90 rounded-full px-6 text-[17px] font-medium h-12 transition-all focus-apple"
              >
                Let's Collaborate
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              {/* Fallback image */}
              <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-900" />
              {/* <img
                src="/cinematic-film-production-behind-the-scenes-profes.jpg"
                alt="Behind the scenes"
                className="w-full h-full object-cover"
              /> */}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-[692px] mx-auto text-center">
          <h2 className="text-[40px] md:text-[56px] font-bold tracking-[-0.015em] mb-6 text-balance">
            Ready to Create Something Extraordinary?
          </h2>
          <p className="text-[19px] md:text-[21px] text-white/70 mb-12 leading-[1.4]">
            Let's bring your vision to life with compelling storytelling.
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 rounded-full px-8 text-[17px] font-medium h-12 transition-all focus-apple"
          >
            Start Your Project
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-white/50">
            <div className="flex items-center gap-2">
              <img src="https://dxzigvsnwmwhwgwg.public.blob.vercel-storage.com/flux-logo-rounded.webp" alt="Flux Nine Labs" className="h-5 w-5 rounded" />
              <span>© 2025 Flux Nine Labs. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
