'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQItem } from '@/types/tool';

interface ToolFAQProps {
  faqs: FAQItem[];
}

export function ToolFAQ({ faqs }: ToolFAQProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  if (!faqs || faqs.length === 0) return null;

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className="faq-section" aria-label="Frequently Asked Questions">
      <h3 className="faq-title">Frequently Asked Questions</h3>
      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isOpen = openIndices.includes(index);
          return (
            <div key={index} className="faq-item">
              <button
                type="button"
                className="faq-question"
                onClick={() => toggleIndex(index)}
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && <div className="faq-answer">{faq.answer}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
