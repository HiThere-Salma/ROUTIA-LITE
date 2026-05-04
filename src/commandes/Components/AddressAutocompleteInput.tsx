import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import {
  isMapboxConfigured,
  isLikelyCompleteAddress,
  searchAddressSuggestions,
  type MapboxAddressSuggestion,
} from "../../lib/geocoding";

type AddressAutocompleteInputProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isSelected?: boolean;
  selectionRequired?: boolean;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: MapboxAddressSuggestion) => void;
  onSelectionStateChange?: (selected: boolean) => void;
};

const MIN_QUERY_LENGTH = 2;

export default function AddressAutocompleteInput({
  id,
  label,
  value,
  required = false,
  disabled = false,
  placeholder,
  isSelected = false,
  selectionRequired = false,
  onChange,
  onSuggestionSelect,
  onSelectionStateChange,
}: AddressAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>([]);
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapboxMissing = !isMapboxConfigured();

  const shouldSearch = useMemo(() => value.trim().length >= MIN_QUERY_LENGTH, [value]);
  const isCompleteAddress = useMemo(() => isLikelyCompleteAddress(value), [value]);
  const showDropdown = open && shouldSearch && !disabled && !mapboxMissing && !isCompleteAddress;

  useEffect(() => {
    if (mapboxMissing) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError(t('addressInput.mapboxConfigError'));
      return;
    }

    if (!shouldSearch || disabled) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }

    if (isCompleteAddress) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      onSelectionStateChange?.(true);
      return;
    }

    let active = true;
    setOpen(true);
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const items = await searchAddressSuggestions(value);
        if (!active) return;
        setSuggestions(items);
        setOpen(true);
      } catch (err) {
        if (!active) return;
        setError(t('addressInput.loadError'));
        setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [disabled, isCompleteAddress, mapboxConfigError, onSelectionStateChange, shouldSearch, value]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (suggestion: MapboxAddressSuggestion) => {
    onChange(suggestion.address);
    onSuggestionSelect?.(suggestion);
    onSelectionStateChange?.(true);
    setOpen(false);
  };

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
    onSelectionStateChange?.(isLikelyCompleteAddress(nextValue));
  };

  const handleFocus = () => {
    if (shouldSearch && !disabled && !mapboxMissing && !isCompleteAddress) {
      setOpen(true);
    }
  };

  const toSuggestionParts = (labelValue: string) => {
    const [main, ...rest] = labelValue.split(",");
    return {
      main: main.trim(),
      secondary: rest.join(",").trim(),
    };
  };

  return (
    <div className="cmd-modal-field cmd-edit-span-2" ref={wrapperRef}>
      <label className="cmd-modal-field-label" htmlFor={id}>{label}</label>

      <div className="cmd-address-wrap">
        <MapPin size={14} className="cmd-address-icon" />
        <input
          id={id}
          className="cmd-edit-input cmd-address-input"
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {!loading && selectionRequired && value.trim().length > 0 && !isSelected && !isCompleteAddress && (
        <p className="cmd-address-warning">{t('addressInput.selectFromSuggestions')}</p>
      )}
      {error && <p className="cmd-address-error">{error}</p>}

      {showDropdown && (
        <div className="cmd-address-dropdown" role="listbox" aria-label={`Suggestions ${label}`}>
          {loading && <p className="cmd-address-hint">{t('addressInput.searchingAddresses')}</p>}

          {suggestions.map((item) => {
            const parts = toSuggestionParts(item.label);
            return (
              <button
                key={item.id}
                type="button"
                className="cmd-address-option"
                onClick={() => handleSelect(item)}
              >
                <span className="cmd-address-option-main">{parts.main}</span>
                {parts.secondary && (
                  <span className="cmd-address-option-meta">{parts.secondary}</span>
                )}
              </button>
            );
          })}

          {!loading && suggestions.length === 0 && !error && (
            <p className="cmd-address-hint">{t('addressInput.noSuggestions')}</p>
          )}
        </div>
      )}
    </div>
  );
}
