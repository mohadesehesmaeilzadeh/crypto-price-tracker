function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search cryptocurrency..."
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default SearchBar;