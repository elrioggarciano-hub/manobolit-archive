'use client'

import React from 'react'
import Link from 'next/link'
import { MANUAL_METADATA, MANUAL_CHAPTERS } from '@/lib/manual/manualData'

export default function ManualPrintPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="print-manual-container">
      {/* Floating Action Bar (Hidden when printed) */}
      <div className="print-controls-bar">
        <div className="print-controls-inner">
          <div className="print-info-text">
            <strong>ManoboLit Archive User Manual (Printable Edition)</strong>
            <span> • Designed for A4 Portrait PDF Export</span>
          </div>
          <div className="print-buttons-group">
            <Link href="/manual" className="btn-secondary">
              ← Return to Digital Reader
            </Link>
            <button type="button" onClick={handlePrint} className="btn-primary">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COVER PAGE (Page 1)
          ========================================================================= */}
      <div className="print-page cover-page">
        <div className="cover-institution-header">
          <div className="inst-main">{MANUAL_METADATA.institution}</div>
          <div className="inst-sub">{MANUAL_METADATA.college}</div>
        </div>

        <div className="cover-badge-banner">
          <h1>USER MANUAL</h1>
        </div>

        <div className="cover-title-block">
          <h2 className="cover-system-title">{MANUAL_METADATA.title}</h2>
          <div className="cover-subtitle">{MANUAL_METADATA.subtitle}</div>
          <p className="cover-description">
            A complete step-by-step guide for every user role with authentic system pictures
            and numbered instructions for every functionality
          </p>
        </div>

        <div className="cover-meta-footer">
          <div className="meta-row">
            <span className="meta-label">Version:</span>
            <span className="meta-value">{MANUAL_METADATA.version}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Publication Date:</span>
            <span className="meta-value">{MANUAL_METADATA.date}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Research & Development:</span>
            <span className="meta-value">{MANUAL_METADATA.authors}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Beneficiary:</span>
            <span className="meta-value">{MANUAL_METADATA.beneficiary}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DOCUMENT INFORMATION & COPYRIGHT (Page 2)
          ========================================================================= */}
      <div className="print-page page-break front-matter-page">
        <div className="running-header">
          <span>MANOBOLIT ARCHIVE  -  User Manual</span>
          <span>Page 2</span>
        </div>

        <div className="front-matter-content">
          <h3 className="section-title">Copyright Notice</h3>
          <p className="legal-paragraph">
            This User Manual, its textual documentation, interface illustrations, classification models,
            and the ManoboLit Archive system that it describes, are works created in accordance with the
            academic and research protocols of the Agusan del Sur State University (ADSSU).
          </p>
          <p className="legal-paragraph">
            All oral literature selections and folk songs curated within the system remain the inviolable
            intangible cultural property of the Agusan Manobo indigenous communities of Agusan del Sur,
            protected pursuant to Republic Act No. 8371 (The Indigenous Peoples Rights Act of 1997) and
            governed by Free, Prior, and Informed Consent (FPIC). No part of this publication may be exploited
            commercially without prior authorization from the customary tribal elders and the university.
          </p>

          <h3 className="section-title" style={{ marginTop: '32px' }}>Document Information</h3>
          <table className="doc-info-table">
            <tbody>
              <tr>
                <td className="doc-info-label">Title</td>
                <td className="doc-info-value">{MANUAL_METADATA.title}: User Manual</td>
              </tr>
              <tr>
                <td className="doc-info-label">Version</td>
                <td className="doc-info-value">{MANUAL_METADATA.version}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Publication Date</td>
                <td className="doc-info-value">{MANUAL_METADATA.date}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Designer & Developer</td>
                <td className="doc-info-value">{MANUAL_METADATA.authors}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Beneficiary Institution</td>
                <td className="doc-info-value">{MANUAL_METADATA.beneficiary}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Language</td>
                <td className="doc-info-value">{MANUAL_METADATA.language}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Format</td>
                <td className="doc-info-value">{MANUAL_METADATA.format}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Baseline Field Corpus</td>
                <td className="doc-info-value">{MANUAL_METADATA.corpusBaseline}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Taxonomic Standards</td>
                <td className="doc-info-value">{MANUAL_METADATA.taxonomies}</td>
              </tr>
              <tr>
                <td className="doc-info-label">Lexicon & Dictionary Reference</td>
                <td className="doc-info-value">{MANUAL_METADATA.lexiconCorpus}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="running-footer">
          <span>{MANUAL_METADATA.institution} • {MANUAL_METADATA.college}</span>
        </div>
      </div>

      {/* =========================================================================
          TABLE OF CONTENTS (Page 3)
          ========================================================================= */}
      <div className="print-page page-break front-matter-page">
        <div className="running-header">
          <span>MANOBOLIT ARCHIVE  -  User Manual</span>
          <span>Page 3</span>
        </div>

        <div className="front-matter-content">
          <h2 className="toc-heading">Table of Contents</h2>
          <div className="toc-list">
            {MANUAL_CHAPTERS.map(ch => (
              <div key={ch.id} className="toc-chapter-block">
                <div className="toc-chapter-line">
                  <span className="toc-chapter-title">
                    Chapter {ch.chapterNumber}: {ch.title}
                  </span>
                  <span className="toc-dots" />
                  <span className="toc-page-num">{ch.chapterNumber * 2 + 2}</span>
                </div>
                <div className="toc-section-list">
                  {ch.sections.map(sec => (
                    <div key={sec.id} className="toc-section-line">
                      <span className="toc-section-title">
                        {sec.sectionNumber}  {sec.title}
                      </span>
                      <span className="toc-dots" />
                      <span className="toc-page-num">{ch.chapterNumber * 2 + 2}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="running-footer">
          <span>{MANUAL_METADATA.institution} • {MANUAL_METADATA.college}</span>
        </div>
      </div>

      {/* =========================================================================
          CHAPTERS CONTENT
          ========================================================================= */}
      {MANUAL_CHAPTERS.map(chapter => (
        <div key={chapter.id} className="chapter-container page-break">
          {/* Chapter Opening Header */}
          <div className="running-header">
            <span>MANOBOLIT ARCHIVE  -  User Manual {chapter.chapterNumber}  {chapter.title}</span>
            <span>Chapter {chapter.chapterNumber}</span>
          </div>

          <div className="chapter-header-box">
            <div className="chapter-prefix">Chapter {chapter.chapterNumber}</div>
            <h2 className="chapter-main-title">{chapter.title}</h2>
            <div className="chapter-subtitle-text">{chapter.subtitle}</div>
            <p className="chapter-summary-text">{chapter.summary}</p>
          </div>

          {/* Chapter Sections */}
          {chapter.sections.map(section => (
            <div key={section.id} className="section-block no-break">
              <h3 className="section-header-title">
                {section.sectionNumber}  {section.title}
              </h3>

              <div className="section-account-meta">
                <div className="account-who">
                  <strong>Who uses it. </strong>
                  <span>{section.whoUsesIt}</span>
                </div>

                {section.capabilities && section.capabilities.length > 0 && (
                  <div className="account-caps">
                    <strong>What this account can do:</strong>
                    <ul>
                      {section.capabilities.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.menuLocation && section.menuLocation.length > 0 && (
                  <div className="account-menu">
                    <strong>Where to find it in the menu:</strong>
                    <ul>
                      {section.menuLocation.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="section-desc-text">{section.description}</p>

              {/* Screenshot Figure with Callouts */}
              {section.figureNumber && section.figureImage && (
                <div className="figure-block no-break">
                  <div className="figure-image-wrapper">
                    <img
                      src={section.figureImage}
                      alt={section.figureAlt || section.figureTitle}
                      className="figure-img"
                    />
                  </div>
                  <div className="figure-caption">
                    <strong>Figure {section.figureNumber}. </strong>
                    <span>{section.figureTitle}. </span>
                    <span className="caption-sub">The red numbers match the steps below.</span>
                  </div>
                </div>
              )}

              {/* Numbered Steps List */}
              {section.steps && section.steps.length > 0 && (
                <div className="steps-block no-break">
                  <div className="steps-heading">Steps</div>
                  <div className="steps-list">
                    {section.steps.map(step => (
                      <div key={step.number} className="step-item">
                        <div className="step-badge">{step.number}</div>
                        <div className="step-body">
                          <strong>{step.label}. </strong>
                          <span>{step.instruction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Good to know Callout Box */}
              {section.goodToKnow && section.goodToKnow.length > 0 && (
                <div className="good-to-know-box no-break">
                  <div className="gtk-header">Good to know</div>
                  <ul className="gtk-list">
                    {section.goodToKnow.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <div className="running-footer">
            <span>{MANUAL_METADATA.institution} • {MANUAL_METADATA.college}</span>
          </div>
        </div>
      ))}

      {/* Clean Global Styles for Screen & Print */}
      <style jsx global>{`
        /* Reset and Base Print Layout */
        .print-manual-container {
          background: #ffffff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
          font-size: 13px;
        }

        /* Screen Floating Controls */
        .print-controls-bar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #18181b;
          color: #ffffff;
          padding: 12px 24px;
          border-bottom: 2px solid #8F000D;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .print-controls-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .print-info-text strong {
          color: #f87171;
        }
        .print-buttons-group {
          display: flex;
          gap: 10px;
        }
        .btn-primary {
          background: #8F000D;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
        }
        .btn-secondary {
          background: #27272a;
          color: #e4e4e7;
          border: 1px solid #3f3f46;
          padding: 8px 14px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 13px;
        }

        /* Page Layout for Preview */
        .print-page, .chapter-container {
          max-width: 900px;
          margin: 20px auto;
          padding: 40px 50px;
          background: #ffffff;
          box-shadow: 0 0 15px rgba(0,0,0,0.06);
          position: relative;
        }

        /* Cover Page */
        .cover-page {
          min-height: 980px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          padding: 60px 40px;
          border: 1px solid #e5e7eb;
        }
        .cover-institution-header .inst-main {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #1f2937;
        }
        .cover-institution-header .inst-sub {
          font-size: 13px;
          color: #4b5563;
          margin-top: 4px;
        }
        .cover-badge-banner {
          margin: 40px 0;
          background: #8F000D;
          color: #ffffff;
          padding: 16px;
          border-radius: 4px;
        }
        .cover-badge-banner h1 {
          margin: 0;
          font-size: 34px;
          letter-spacing: 0.15em;
          font-weight: 900;
        }
        .cover-system-title {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.4;
          color: #111827;
          margin: 0 0 16px;
        }
        .cover-subtitle {
          font-size: 14px;
          font-style: italic;
          color: #374151;
          margin-bottom: 16px;
        }
        .cover-description {
          font-size: 13px;
          color: #4b5563;
          max-width: 650px;
          margin: 0 auto;
        }
        .cover-meta-footer {
          border-top: 2px solid #8F000D;
          padding-top: 20px;
          text-align: left;
          font-size: 12px;
          max-width: 650px;
          margin: 0 auto;
          width: 100%;
        }
        .meta-row {
          display: flex;
          margin-bottom: 6px;
        }
        .meta-label {
          width: 180px;
          font-weight: bold;
          color: #374151;
        }
        .meta-value {
          color: #111827;
        }

        /* Running Headers and Footers */
        .running-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 6px;
          margin-bottom: 24px;
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
        }
        .running-footer {
          margin-top: 40px;
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        }

        /* Front Matter */
        .front-matter-page {
          min-height: 850px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        .legal-paragraph {
          font-size: 12px;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 12px;
        }
        .doc-info-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 12px;
        }
        .doc-info-table td {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
        }
        .doc-info-label {
          width: 220px;
          font-weight: bold;
          background: #f9fafb;
          color: #374151;
        }
        .doc-info-value {
          color: #111827;
        }

        /* Table of Contents */
        .toc-heading {
          font-size: 22px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 20px;
        }
        .toc-chapter-line {
          display: flex;
          align-items: baseline;
          font-weight: bold;
          font-size: 13px;
          margin-top: 14px;
        }
        .toc-section-line {
          display: flex;
          align-items: baseline;
          font-size: 12px;
          margin-left: 16px;
          margin-top: 4px;
          color: #374151;
        }
        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #9ca3af;
          margin: 0 8px;
        }
        .toc-page-num {
          font-weight: bold;
          color: #111827;
        }

        /* Chapter Styles */
        .chapter-header-box {
          border-left: 4px solid #8F000D;
          padding-left: 16px;
          margin-bottom: 28px;
        }
        .chapter-prefix {
          font-size: 11px;
          font-weight: 800;
          color: #8F000D;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .chapter-main-title {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin: 4px 0;
        }
        .chapter-subtitle-text {
          font-size: 13px;
          font-style: italic;
          color: #4b5563;
        }
        .chapter-summary-text {
          font-size: 12px;
          color: #4b5563;
          margin-top: 8px;
        }

        /* Section Block */
        .section-block {
          margin-bottom: 36px;
        }
        .section-header-title {
          font-size: 16px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 10px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 4px;
        }
        .section-account-meta {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 10px 14px;
          margin-bottom: 14px;
          font-size: 12px;
        }
        .section-account-meta ul {
          margin: 4px 0 0;
          padding-left: 20px;
        }
        .section-desc-text {
          font-size: 12px;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 16px;
        }

        /* Figures & Callouts */
        .figure-block {
          margin: 16px 0 20px;
          text-align: center;
        }
        .figure-image-wrapper {
          border: 1px solid #d1d5db;
          border-radius: 4px;
          overflow: hidden;
          background: #f9fafb;
        }
        .figure-img {
          width: 100%;
          height: auto;
          display: block;
        }
        .figure-caption {
          font-size: 11px;
          color: #4b5563;
          margin-top: 6px;
        }
        .caption-sub {
          font-style: italic;
          color: #6b7280;
        }

        /* Steps List */
        .steps-block {
          margin: 16px 0;
        }
        .steps-heading {
          font-size: 13px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 10px;
        }
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .step-badge {
          width: 22px;
          height: 22px;
          min-width: 22px;
          border-radius: 50%;
          background: #dc2626;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .step-body {
          font-size: 12px;
          line-height: 1.5;
          color: #1f2937;
        }

        /* Good to know Box */
        .good-to-know-box {
          background: #fef9c3;
          border: 1px solid #fde047;
          border-left: 4px solid #eab308;
          border-radius: 4px;
          padding: 10px 14px;
          margin: 16px 0;
        }
        .gtk-header {
          font-size: 11px;
          font-weight: bold;
          color: #854d0e;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .gtk-list {
          margin: 0;
          padding-left: 18px;
          font-size: 11.5px;
          color: #713f12;
          line-height: 1.5;
        }

        /* Print Media Styles */
        @media print {
          .print-controls-bar {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-page, .chapter-container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .figure-img {
            max-height: 380px !important;
            object-fit: contain !important;
          }
        }
      `}</style>
    </div>
  )
}

