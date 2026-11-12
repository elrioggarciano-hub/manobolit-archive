'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/lib/context/LanguageContext'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)

    // Setup scroll reveal intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    const elements = document.querySelectorAll('.scroll-reveal')
    elements.forEach(el => observer.observe(el))

    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [pathname])

  const navItems = [
    { href: '/explore', label: t('nav_explorer') },
    { href: '/classification', label: t('nav_classification') },
    { href: '/translator', label: t('nav_translator') },
    { href: '/dashboard', label: t('nav_dashboard') },
    { href: '/about', label: t('nav_about') },
  ]

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <h1 style={{
              margin: 0,
              color: 'var(--brand-accent)',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 4.5vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              ManoboLit Archive
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/explore' && pathname.startsWith('/explore')) || (item.href === '/about' && pathname === '/about')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-2 text-xs font-bold tracking-wider"
                  style={{
                    textDecoration: 'none',
                    color: isActive ? 'var(--brand-accent)' : 'var(--text-secondary)',
                    borderBottom: isActive ? '2px solid #8F000D' : '2px solid transparent',
                    paddingBottom: '4px',
                    transition: 'color 0.2s ease, border-color 0.25s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Right Action (Search, Language, Theme, & User Circle Icon) & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Search Input Box */}
            {pathname !== '/' && (
              <div className="relative hidden lg:flex items-center">
                <span className="absolute left-3 flex items-center text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  className="pl-9 pr-4 py-2 text-xs border-0 placeholder-slate-500 focus:outline-none input-anim"
                  style={{
                    borderRadius: '4px',
                    height: '36px',
                    width: '200px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/explore?search=${encodeURIComponent(e.currentTarget.value)}`)
                    }
                  }}
                />
              </div>
            )}

            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector compact />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Circle Icon */}
            <Link
              href="/admin"
              className="hidden sm:flex items-center justify-center transition-colors"
              title={t('admin_dashboard')}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '1.5px solid #8F000D',
                color: 'var(--brand-accent)',
                background: 'transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="block md:hidden p-2 hover:text-[#1e293b] focus:outline-none btn-anim"
              style={{ background: 'transparent', color: 'var(--text-secondary)' }}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.25s var(--ease-out-smooth, ease)', transform: isMobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="block md:hidden border-t px-6 py-4 dropdown-anim"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--header-border)',
          }}
        >
          {/* Mobile Search Box */}
          {pathname !== '/' && (
            <div className="relative mb-4 stagger-item">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                className="w-full pl-9 pr-4 py-2 text-xs border border-[var(--border-color)] placeholder-slate-500 focus:outline-none input-anim"
                style={{
                  borderRadius: '6px',
                  height: '38px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsMobileMenuOpen(false)
                    router.push(`/explore?search=${encodeURIComponent(e.currentTarget.value)}`)
                  }
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-4 stagger-item">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {t('appearance')}
            </span>
            <div className="flex items-center gap-2">
              <LanguageSelector compact />
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex flex-col gap-4">
            {navItems.map((item, i) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-1 text-sm font-semibold tracking-wider transition-colors duration-200 stagger-item"
                  style={{
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary-red)' : 'var(--text-secondary)',
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  {item.label}
                </Link>
              )
            })}

            <Link
              href="/admin"
              className="mt-2 text-center py-2 rounded-md text-sm font-bold btn-anim stagger-item"
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                border: '1px solid var(--border-color)',
                animationDelay: `${navItems.length * 40}ms`,
              }}
            >
              {t('admin_dashboard')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
