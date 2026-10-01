import { COUNTRY_LIST, type CountryCode } from "@/lib/countries.ts";

export function CountrySelect(
  props: { value: CountryCode; onChange: (code: CountryCode) => void },
) {
  return (
    <label>
      Country
      <select
        value={props.value}
        onInput={(event) =>
          props.onChange(event.currentTarget.value as CountryCode)}
      >
        {COUNTRY_LIST.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} ({country.format.currency})
          </option>
        ))}
      </select>
    </label>
  );
}
