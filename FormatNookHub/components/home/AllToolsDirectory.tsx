'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toolRegistry } from '@/config/tools';
import { categoryList } from '@/config/categories';
import { IconRenderer } from '@/components/shared/IconRenderer';

export function AllToolsDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll Container Ref, Overflow & Drag State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Checks horizontal overflow & updates scroll button visibility
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(el);
    }

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        updateScrollState();
      });
    }

    window.addEventListener('resize', updateScrollState);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Smooth scroll buttons
  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  // Natural mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      updateScrollState();
    }
  };

  // Mouse drag-to-scroll (pan) for desktop mouse users
  const getEventX = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof e.pageX === 'number' && e.pageX !== 0) return e.pageX;
    if (typeof e.clientX === 'number' && e.clientX !== 0) return e.clientX;
    return e.pageX ?? e.clientX ?? 0;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    const xCoord = getEventX(e);
    startXRef.current = xCoord - (scrollContainerRef.current.offsetLeft || 0);
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !scrollContainerRef.current) return;
    const xCoord = getEventX(e);
    const x = xCoord - (scrollContainerRef.current.offsetLeft || 0);
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
      setIsDragging(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
    if (isDragging) setIsDragging(false);
  };

  // Center clicked category pill in viewport
  const handleCategorySelect = (catId: string, targetEl?: HTMLElement) => {
    // If user dragged to pan, ignore the click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setSelectedCategory(catId);
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Sync scroll position when category changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeBtn = scrollContainerRef.current.querySelector('.filter-tab.active') as HTMLElement;
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    updateScrollState();
  }, [selectedCategory, updateScrollState]);

  const filteredTools = useMemo(() => {
    return toolRegistry.filter((tool) => {
      const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
        tool.searchAliases.some((a) => a.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="home-section" id="directory" aria-label="All Tools Directory">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">All Developer Tools Directory</h2>
            <p className="home-section-desc">Browse our complete catalogue of utilities and planned modules.</p>
          </div>

          <div className="home-section-actions">
            {/* Keyword Search Filter */}
            <div className="directory-search-box">
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Filter tools by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="select-control"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Category Filter Pills with Left/Right Chevrons */}
        <div
          className={`directory-filters-wrapper ${canScrollLeft ? 'has-overflow-left' : ''} ${
            canScrollRight ? 'has-overflow-right' : ''
          }`}
        >
          {canScrollLeft && (
            <button
              type="button"
              className="directory-scroll-btn directory-scroll-btn-left"
              onClick={handleScrollLeft}
              aria-label="Scroll categories left"
              data-testid="directory-scroll-left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className={`directory-filters ${isDragging ? 'is-dragging' : ''}`}
            onScroll={updateScrollState}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            role="tablist"
            aria-label="Filter tools by category"
            data-testid="directory-filters"
          >
            <button
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={(e) => handleCategorySelect('all', e.currentTarget)}
            >
              All Categories ({toolRegistry.length})
            </button>
            {categoryList.map((cat) => {
              const count = toolRegistry.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={selectedCategory === cat.id}
                  className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={(e) => handleCategorySelect(cat.id, e.currentTarget)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="directory-scroll-btn directory-scroll-btn-right"
              onClick={handleScrollRight}
              aria-label="Scroll categories right"
              data-testid="directory-scroll-right"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="tool-cards-grid">
          {filteredTools.map((tool) => {
            const isImplemented = tool.status === 'implemented';
            const CardContent = (
              <>
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={22} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-neutral">
                    {tool.category.toUpperCase()}
                  </span>
                  {isImplemented ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--color-success)',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={13} /> Available
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={13} /> In Roadmap
                    </span>
                  )}
                </div>
              </>
            );

            if (isImplemented) {
              return (
                <Link key={tool.id} href={tool.route} className="tool-card">
                  {CardContent}
                </Link>
              );
            }

            return (
              <div key={tool.id} className="tool-card tool-card-roadmap">
                {CardContent}
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            No utilities match your search. Try resetting your category filter or search query.
          </div>
        )}
      </div>
    </section>
  );
}
