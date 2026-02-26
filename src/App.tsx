import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ArrowRight, Menu } from "lucide-react"
import { FaYoutube, FaXTwitter, FaInstagram } from 'react-icons/fa6';
import { MagneticButton } from "@/components/MagneticButton"
import { ParallaxImage } from "@/components/ParallaxImage"
import { LiveContentGrid } from "@/components/LiveContentGrid"
import { Section, Container } from "@/components/system/Layout"
import { H2, Text, Label } from "@/components/system/Typography"
import { Card } from "@/components/system/Card"
import { fetchChannelStats } from "@/services/youtube"

// Animation configurations
const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }
}

const NAV_LINKS = [
  { href: "#work", label: "Work" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#about", label: "About" },
]

const FOOTER_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Contact" },
]

const SOCIAL_LINKS = [
  { icon: FaYoutube, href: "https://www.youtube.com/channel/UC23OIrDByxQWNPRlNAEE4Jw", label: "YouTube" },
  { icon: FaXTwitter, href: "http://www.twitter.com/wave_react", label: "X (Twitter)" },
  { icon: FaInstagram, href: "http://www.instagram.com/wave_react", label: "Instagram" },
]

// Helper for formatting large numbers (e.g. 1.2K, 3.5M)
const formatCompactNumber = (number: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
}

export default function App() {
  const [scrollY, setScrollY] = useState(0)
  const [networkStats, setNetworkStats] = useState({
    subscribers: 0,
    views: 0,
    videos: 0,
    loaded: false
  })

  const aboutRef = useRef(null)
  const workRef = useRef(null)

  const aboutInView = useInView(aboutRef, { once: true, margin: "-100px" })
  const workInView = useInView(workRef, { once: true, margin: "-100px" })

  // Channel IDs for aggregation
  const CHANNEL_IDS = ['UC23OIrDByxQWNPRlNAEE4Jw', 'UC0lHFeAnmmur94LWBNumBUg'];

  // Always scroll to top on mount and disable scroll restoration
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Force immediate scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // Backup scroll to top after a brief delay
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, 0)
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) return;

      try {
        const promises = CHANNEL_IDS.map(id => fetchChannelStats(id, apiKey));
        const results = await Promise.all(promises);

        const aggregated = results.reduce((acc, curr) => {
          if (!curr) return acc;
          return {
            subscribers: acc.subscribers + parseInt(curr.subscriberCount),
            views: acc.views + parseInt(curr.viewCount),
            videos: acc.videos + parseInt(curr.videoCount)
          };
        }, { subscribers: 0, views: 0, videos: 0 });

        // If we got zeros (API error or empty), use fallback
        if (aggregated.subscribers === 0) throw new Error("API returned empty data");

        setNetworkStats({ ...aggregated, loaded: true });
      } catch (error) {
        console.warn("Failed to load live network stats, using fallback", error);
        // Fallback to "last known good" values so UI never breaks
        setNetworkStats({
          subscribers: 98500,
          views: 3200000,
          videos: 320,
          loaded: true
        });
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen font-sans selection:bg-white/20">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 20
          ? 'bg-black/70 backdrop-blur-xl border-b border-[var(--border-subtle)]'
          : 'bg-transparent backdrop-blur-sm'
          }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href="#"
              className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] rounded-md"
              aria-label="Flux Nine Labs home"
            >
              <img
                src="https://dxzigvsnwmwhwgwg.public.blob.vercel-storage.com/flux-logo-rounded.webp"
                alt=""
                className="h-8 w-8 rounded transition-transform duration-300 group-hover:scale-105"
                aria-hidden="true"
              />
              <span className="text-[15px] font-bold tracking-[0.03em]">FLUX NINE LABS</span>
            </a>
          </motion.div>

          {/* Desktop Nav */}
          <motion.div
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14px] font-semibold tracking-[0.01em] transition-opacity duration-200 hover:opacity-60"
              >
                {link.label}
              </a>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <MagneticButton
                size="sm"
                className="header-cta bg-white text-black hover:bg-white/95 rounded-full px-5 h-9 text-[13px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
              >
                Contact
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-white/10 w-[300px]">
              <div className="flex flex-col gap-6 mt-8">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-lg font-semibold text-white hover:text-white/70 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] rounded-md"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>


      </nav>

      {/* Hero - Text with Cinematic Background */}
      <section className="relative w-full py-32 md:py-40 lg:py-48 overflow-hidden" role="banner">
        {/* Tier 3 Abstract Cinematic Background */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.07),transparent)] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(77,208,225,0.04),transparent)] animate-drift" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">
              Creators of <span className="text-[var(--accent-primary)]">WaveReact</span> and <span className="text-[var(--accent-primary)]">After The Midnight</span>.
            </h1>
            <p className="text-[clamp(1.125rem,2vw,1.375rem)] leading-[1.5] text-[var(--text-secondary)] max-w-2xl">
              A deeper look at how music is made.
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Work (Single Focus) */}
      <Section id="work" spacing="lg" ref={workRef}>
        <Container>
          <motion.div
            {...FADE_UP}
            animate={workInView ? FADE_UP.animate : FADE_UP.initial}
          >
            {/* Removed border-[var(--border-subtle)] for a cleaner, frameless look */}
            <Card className="aspect-[16/9] mb-8 overflow-hidden bg-black/40 shadow-2xl">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/xCdDZfRVKzw"
                title="Featured Project"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Card>

            {/* Latest Videos Grid */}
            <div className="mt-16">
              <LiveContentGrid handles={['UC23OIrDByxQWNPRlNAEE4Jw', 'UC0lHFeAnmmur94LWBNumBUg']} />
            </div>

            {/* Network Stats - Quiet Context */}
            <div className="mt-20 pt-12 border-t border-[var(--border-subtle)]">
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: networkStats.loaded ? 1 : 0 }}
                    className="text-[32px] font-bold tabular-nums text-[var(--text-primary)] mb-1"
                  >
                    {networkStats.loaded ? formatCompactNumber(networkStats.subscribers) : "-"}
                  </motion.div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] opacity-60">Subscribers</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: networkStats.loaded ? 1 : 0 }}
                    className="text-[32px] font-bold tabular-nums text-[var(--text-primary)] mb-1"
                  >
                    {networkStats.loaded ? formatCompactNumber(networkStats.views) : "-"}
                  </motion.div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] opacity-60">Views</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: networkStats.loaded ? 1 : 0 }}
                    className="text-[32px] font-bold tabular-nums text-[var(--text-primary)] mb-1"
                  >
                    {networkStats.loaded ? formatCompactNumber(networkStats.videos) : "-"}
                  </motion.div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] opacity-60">Videos</div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>



      <Container>
        <div className="divider my-10 md:my-12" />
      </Container>

      {/* About Section */}
      <Section id="about" spacing="lg" ref={aboutRef}>
        <Container>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              {...FADE_UP}
              animate={aboutInView ? FADE_UP.animate : FADE_UP.initial}
            >
              <Label>About Us</Label>
              <H2 className="mb-3">
                Crafting Stories That Matter
              </H2>
              <div className="space-y-6">
                <Text>
                  We are a collective of filmmakers and creative visionaries dedicated to pushing the boundaries of visual storytelling.
                </Text>
                <Text>
                  With over a decade of experience, we bring technical excellence and artistic vision to every project.
                </Text>
              </div>
              <MagneticButton
                size="lg"
                className="mt-4 bg-white text-black hover:bg-white/90 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] rounded-full px-6 text-[17px] font-bold h-12 transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Let's Collaborate
                <ArrowRight className="w-4 h-4 ml-2" />
              </MagneticButton>
            </motion.div>

            <motion.div
              {...FADE_UP}
              animate={aboutInView ? FADE_UP.animate : FADE_UP.initial}
              transition={{ ...FADE_UP.transition, delay: 0.2 }}
            >
              <Card hoverEffect className="aspect-[3/4] border-[var(--border-subtle)]">
                <ParallaxImage
                  src="/studio-setup.jpg"
                  alt="Behind the scenes at Flux Nine Labs studio"
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                />
              </Card>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-12 px-6 bg-[var(--bg-primary)]" role="contentinfo">
        <div className="max-w-[980px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <img
                src="https://dxzigvsnwmwhwgwg.public.blob.vercel-storage.com/flux-logo-rounded.webp"
                alt=""
                className="h-5 w-5 rounded"
                aria-hidden="true"
              />
              <span>© {new Date().getFullYear()} Flux Nine Labs. All rights reserved.</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <nav className="flex items-center gap-6" aria-label="Footer navigation">
                {FOOTER_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] rounded-md"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-4 text-[var(--text-tertiary)]">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-white/5 rounded-full duration-300 focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
                    aria-label={`Visit our ${social.label} page`}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div >
  )
}
