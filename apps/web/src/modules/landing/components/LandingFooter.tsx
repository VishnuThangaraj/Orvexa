import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Search, X } from "lucide-react";
import { OrvexaLogo } from "@/common/components/OrvexaLogo";
import {
  FOOTER_COLUMNS,
  FOOTER_LEGAL_LINKS,
  type FooterLinkItem,
} from "../constants/landing.constants";

const FooterLink: React.FC<{
  item: FooterLinkItem;
  className?: string;
  onClick?: () => void;
}> = ({ item, className = "", onClick }) => {
  if (item.to) {
    return (
      <Link to={item.to} onClick={onClick} className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <a
      href={item.href ?? "#"}
      onClick={(e) => {
        if (!item.href) e.preventDefault();
        onClick?.();
      }}
      className={className}
    >
      {item.label}
    </a>
  );
};

const LandingFooter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const allSearchableItems = useMemo(
    () =>
      FOOTER_COLUMNS.flatMap((column) =>
        column.flatMap((section) =>
          section.items.map((item) => ({
            ...item,
            section: section.title,
          })),
        ),
      ),
    [],
  );

  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];
    return allSearchableItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(trimmed) ||
          item.section.toLowerCase().includes(trimmed),
      )
      .slice(0, 8);
  }, [allSearchableItems, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer className="w-full bg-[#F8F9FA] dark:bg-slate-900/95 text-[#3C4043] dark:text-slate-300 px-[10%] pt-8 pb-10">
      <div className="max-w-360 mx-auto">
        {/* Top bar: Brand tagline + site search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DADCE0] dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="flex items-baseline gap-1.5">
              <OrvexaLogo className="text-[20px] tracking-tight" />
              <span className="text-[18px] text-[#3C4043] dark:text-slate-200 font-medium tracking-tight leading-none">
                Workspace
              </span>
            </Link>
            <span
              className="hidden sm:inline-block h-4 w-px bg-[#DADCE0] dark:bg-slate-700 mx-1"
              aria-hidden="true"
            />
            <span className="text-[13px] text-[#5F6368] dark:text-slate-400">
              Unified Self-Hosted Collaboration Suite
            </span>
          </div>

          {/* Search this site */}
          <div ref={searchContainerRef} className="relative w-full sm:w-72 md:w-80">
            <div className="flex items-center gap-2.5 bg-[#EFEFEF] dark:bg-slate-800 rounded-xs px-3 py-2 border border-transparent focus-within:border-[#1A73E8] focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
              <Search
                size={16}
                className="text-[#5F6368] dark:text-slate-400 shrink-0"
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search Orvexa links"
                aria-label="Search Orvexa links"
                className="w-full bg-transparent text-[13px] text-[#202124] dark:text-slate-100 placeholder:text-[#5F6368] dark:placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="text-[#5F6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 left-0 mt-1 bg-white dark:bg-slate-900 border border-[#DADCE0] dark:border-slate-700 rounded-md shadow-lg py-1.5 z-30 max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <FooterLink
                      key={`${result.section}-${result.label}`}
                      item={result}
                      onClick={() => {
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between px-3 py-2 text-[12.5px] text-[#3C4043] dark:text-slate-200 hover:bg-[#F1F3F4] dark:hover:bg-slate-800 transition-colors"
                    />
                  ))
                ) : (
                  <div className="px-3 py-2 text-[12.5px] text-[#5F6368] dark:text-slate-400">
                    No matching links found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main 5-column sitemap */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10">
          {FOOTER_COLUMNS.map((column, columnIndex) => (
            <div key={`footer-col-${columnIndex}`} className="flex flex-col gap-9">
              {column.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[14.5px] font-medium text-[#3C4043] dark:text-slate-100 mb-3.5">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <FooterLink
                          item={item}
                          className="text-[12.5px] leading-[1.4] text-[#5F6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-100 transition-colors"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar: Wordmark + section links | Help */}
        <div className="pt-7 border-t border-[#DADCE0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link
              to="/"
              className="text-[20px] font-medium tracking-tight text-[#5F6368] dark:text-slate-400 select-none leading-none mr-1"
            >
              Orvexa
            </Link>

            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {FOOTER_LEGAL_LINKS.map((item) => (
                <FooterLink
                  key={item.label}
                  item={item}
                  className="text-[12.5px] text-[#5F6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-100 transition-colors"
                />
              ))}
            </nav>
          </div>

          <a
            href="#faq"
            className="inline-flex items-center gap-2 text-[12.5px] text-[#5F6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-100 transition-colors"
          >
            <HelpCircle
              size={18}
              className="fill-[#5F6368] text-[#F8F9FA] dark:fill-slate-400 dark:text-slate-900 shrink-0"
            />
            <span>Help &amp; FAQ</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
