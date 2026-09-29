import type {
  SearchBarProps,
} from "../types/crypto";

function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <label
        className="visually-hidden"
        htmlFor="market-search"
      >
        Search cryptocurrencies
      </label>
      <svg
        className="search-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m16.25 16.25 4 4" />
      </svg>
      <input
        id="market-search"
        type="text"
        placeholder="Search cryptocurrency..."
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default SearchBar;
