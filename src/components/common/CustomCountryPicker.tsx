import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Check, 
  X, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { 
  COUNTRIES_DATABASE, 
  COUNTRY_PRESET_BUNDLES,
  CountryData, 
  CountryPresetBundle,
  getAvailableInitials,
  getCountriesByInitial,
  searchCountriesWithRecall,
  parseCustomCountryCodes
} from '../../utils/countryCodes.js';

interface CustomCountryPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  allowCustomInput?: boolean;
}

export function CustomCountryPicker({
  value,
  onChange,
  label = 'Target Country & Geo Routing Options',
  helperText = 'Select preset regions, recall countries by alphabet initial, or enter custom ISO country codes.',
  allowCustomInput = true
}: CustomCountryPickerProps) {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedCustomOpen, setIsAdvancedCustomOpen] = useState(false);
  const [rawTextInput, setRawTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'initials' | 'search'>('presets');

  // Parse current value
  const parsed = useMemo(() => {
    return parseCustomCountryCodes(value || 'Worldwide');
  }, [value]);

  const availableInitials = useMemo(() => {
    return getAvailableInitials();
  }, []);

  // Filtered countries based on active tab / state
  const displayedCountries = useMemo(() => {
    if (activeTab === 'search' || searchQuery.trim().length > 0) {
      return searchCountriesWithRecall(searchQuery);
    }
    if (activeTab === 'initials' && selectedInitial) {
      return getCountriesByInitial(selectedInitial);
    }
    return COUNTRIES_DATABASE;
  }, [activeTab, selectedInitial, searchQuery]);

  // Check if a country is currently selected in value
  const isCountrySelected = (code: string) => {
    if (parsed.isWorldwide) return false;
    return parsed.matchedCountries.some(c => c.code === code);
  };

  // Toggle single country selection
  const handleToggleCountry = (country: CountryData) => {
    if (parsed.isWorldwide) {
      // Switching from worldwide to specific country
      onChange(country.name);
      return;
    }

    const currentCodes = new Set(parsed.matchedCountries.map(c => c.code));
    if (currentCodes.has(country.code)) {
      currentCodes.delete(country.code);
    } else {
      currentCodes.add(country.code);
    }

    if (currentCodes.size === 0) {
      onChange('Worldwide');
    } else {
      const selectedNames = COUNTRIES_DATABASE
        .filter(c => currentCodes.has(c.code))
        .map(c => c.name);
      onChange(selectedNames.join(', '));
    }
  };

  // Apply bundle preset
  const handleSelectBundle = (bundle: CountryPresetBundle) => {
    if (bundle.id === 'worldwide' || bundle.countryCodes.length === 0) {
      onChange('Worldwide');
      return;
    }

    const names = COUNTRIES_DATABASE
      .filter(c => bundle.countryCodes.includes(c.code))
      .map(c => c.name);
    onChange(names.join(', '));
  };

  // Apply quick initial recall (select all countries under that initial)
  const handleSelectAllInInitial = (initial: string) => {
    const countriesInInitial = getCountriesByInitial(initial);
    const currentCodes = new Set(parsed.matchedCountries.map(c => c.code));
    countriesInInitial.forEach(c => currentCodes.add(c.code));

    const selectedNames = COUNTRIES_DATABASE
      .filter(c => currentCodes.has(c.code))
      .map(c => c.name);
    onChange(selectedNames.join(', '));
  };

  // Remove single country chip
  const handleRemoveChip = (codeToRemove: string) => {
    const remaining = parsed.matchedCountries.filter(c => c.code !== codeToRemove);
    if (remaining.length === 0) {
      onChange('Worldwide');
    } else {
      onChange(remaining.map(c => c.name).join(', '));
    }
  };

  // Handle manual raw text input apply
  const handleApplyRawTextInput = () => {
    if (!rawTextInput.trim()) return;
    const res = parseCustomCountryCodes(rawTextInput);
    if (res.matchedCountries.length > 0) {
      onChange(res.matchedCountries.map(c => c.name).join(', '));
      setRawTextInput('');
      setIsAdvancedCustomOpen(false);
    } else if (res.isWorldwide) {
      onChange('Worldwide');
      setRawTextInput('');
      setIsAdvancedCustomOpen(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 shadow-sm">
      {/* Header & Current Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>{label}</span>
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400">Targeting:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            {parsed.isWorldwide ? (
              <>
                <span>🌐</span> Worldwide (Global Pool)
              </>
            ) : (
              <>
                <span className="font-bold">{parsed.matchedCountries.length}</span> Countries Selected
              </>
            )}
          </span>
        </div>
      </div>

      {/* Selected Country Chips (if not Worldwide) */}
      {!parsed.isWorldwide && parsed.matchedCountries.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Targeted Locations ({parsed.matchedCountries.length}):
            </span>
            <button
              type="button"
              onClick={() => onChange('Worldwide')}
              className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Reset to Worldwide
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-lg border border-slate-800 bg-slate-950/60">
            {parsed.matchedCountries.map((c) => (
              <span
                key={c.code}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-900/40 border border-emerald-600/50 px-2 py-0.5 text-[11px] font-medium text-emerald-200 shadow-xs"
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded">
                  {c.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveChip(c.code)}
                  className="ml-0.5 hover:text-white text-emerald-400 focus:outline-none"
                  title={`Remove ${c.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 p-1 border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('presets');
            setSearchQuery('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
            activeTab === 'presets' && !searchQuery
              ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Regional Bundles</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('initials');
            if (!selectedInitial) setSelectedInitial('U');
            setSearchQuery('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
            activeTab === 'initials' && !searchQuery
              ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Recall by Initial (A-Z)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('search');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
            activeTab === 'search' || searchQuery
              ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search & ISO Codes</span>
        </button>
      </div>

      {/* TAB 1: PRESET BUNDLES */}
      {activeTab === 'presets' && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COUNTRY_PRESET_BUNDLES.map((bundle) => {
            const isSelected =
              bundle.id === 'worldwide'
                ? parsed.isWorldwide
                : bundle.countryCodes.length > 0 &&
                  bundle.countryCodes.every(code => parsed.matchedCountries.some(c => c.code === code)) &&
                  parsed.matchedCountries.length === bundle.countryCodes.length;

            return (
              <button
                key={bundle.id}
                type="button"
                onClick={() => handleSelectBundle(bundle)}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/60 ring-1 ring-emerald-500 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{bundle.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{bundle.name}</span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{bundle.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: RECALL BY INITIAL (A-Z) */}
      {activeTab === 'initials' && !searchQuery && (
        <div className="space-y-3">
          {/* Alphabet Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Select Initial to Recall Countries:
            </span>
            {selectedInitial && (
              <button
                type="button"
                onClick={() => handleSelectAllInInitial(selectedInitial)}
                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                + Add All Starting with '{selectedInitial}'
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1 p-1 rounded-lg border border-slate-800 bg-slate-950/70">
            {availableInitials.map(({ initial, count }) => {
              const isActive = selectedInitial === initial;
              return (
                <button
                  key={initial}
                  type="button"
                  onClick={() => setSelectedInitial(initial)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{initial}</span>
                  <span className={`text-[9px] px-1 rounded-full ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Countries Grid for Selected Initial */}
          {selectedInitial && (
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">
                Countries starting with <strong className="text-emerald-400">"{selectedInitial}"</strong>:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 rounded-lg border border-slate-800/80 bg-slate-950/40">
                {getCountriesByInitial(selectedInitial).map((country) => {
                  const selected = isCountrySelected(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleToggleCountry(country)}
                      className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-950/70 text-white font-semibold shadow-xs'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400 shrink-0 ml-1">
                        {country.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH & DIRECT ISO LOOKUP */}
      {(activeTab === 'search' || searchQuery) && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type initial letter (e.g. 'I', 'U', 'B') or country name / code (e.g. IN, USA, Botswana)..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Found {displayedCountries.length} countries matching query:</span>
            {searchQuery && (
              <span className="text-emerald-400 font-mono text-[10px]">
                Tip: Click to toggle into your active targeting pool
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-1.5 rounded-lg border border-slate-800 bg-slate-950/60">
            {displayedCountries.map((country) => {
              const selected = isCountrySelected(country.code);
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleToggleCountry(country)}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-all ${
                    selected
                      ? 'border-emerald-500 bg-emerald-950/80 text-white font-semibold shadow-xs'
                      : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">{country.flag}</span>
                    <span className="truncate">{country.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                      {country.code}
                    </span>
                    {selected && <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Custom Raw Codes Toggle */}
      {allowCustomInput && (
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setIsAdvancedCustomOpen(!isAdvancedCustomOpen)}
            className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span>Paste Custom Country Codes (Bulk Entry & Initial Recall)</span>
            </span>
            {isAdvancedCustomOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {isAdvancedCustomOpen && (
            <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
              <label className="block text-[11px] font-semibold text-slate-300">
                Comma-separated ISO Codes, country initials, or names:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rawTextInput}
                  onChange={(e) => setRawTextInput(e.target.value)}
                  placeholder="e.g. IN, US, GB, BW, DE, Australia, Singapore or single initials i, u, b"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyRawTextInput}
                  className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-500 transition-colors shrink-0"
                >
                  Recall & Apply
                </button>
              </div>

              {rawTextInput.trim() && (
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>Detected:</span>
                  <span className="text-emerald-400 font-semibold">
                    {parseCustomCountryCodes(rawTextInput).matchedCountries.length} countries recognized
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
