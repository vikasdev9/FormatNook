import React from 'react';
import { ToolFAQ } from '@/components/workspace/ToolFAQ';
import { FAQItem } from '@/types/tool';

export function HomeFAQ() {
  const homeFaqs: FAQItem[] = [
    {
      question: 'Is my data secure when using FormatNook utilities?',
      answer: 'Yes, completely. FormatNook executes code formatting, JSON validation, Base64 conversions, and image processing client-side in your local web browser. Your inputs and outputs never leave your machine, preventing accidental data leaks.',
    },
    {
      question: 'Are there any limits on file size or request volume?',
      answer: 'There are no daily or hourly limits. You can format as many files as needed. For file uploads, browser memory comfortably supports files up to 25MB.',
    },
    {
      question: 'Can FormatNook be used offline?',
      answer: 'Yes. Once the page is loaded, the client-side JavaScript bundle handles formatting, parsing, and conversions without requiring an active internet connection.',
    },
    {
      question: 'Can I suggest or request a new developer tool?',
      answer: 'Absolutely. We actively expand our tool modules. Feel free to open an issue or pull request on our GitHub repository.',
    },
  ];

  return (
    <section className="home-section" aria-label="Frequently Asked Questions">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">Frequently Asked Questions</h2>
            <p className="home-section-desc">Answers to common questions about security, compatibility, and features.</p>
          </div>
        </div>

        <ToolFAQ faqs={homeFaqs} />
      </div>
    </section>
  );
}
