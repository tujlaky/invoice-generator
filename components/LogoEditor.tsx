export function LogoEditor(
  props: {
    logoDataUrl: string;
    fallback: string;
    description: string;
    onChange: (logoDataUrl: string) => void;
  },
) {
  const updateLogo = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      props.onChange(String(reader.result ?? ""));
    });
    reader.readAsDataURL(file);
  };

  return (
    <section class="logo-editor" aria-label="Logo">
      <div>
        <h2>Logo</h2>
        <p>{props.description}</p>
      </div>
      <div class="logo-control-row">
        <label class="file-button">
          Upload logo
          <input
            type="file"
            accept="image/jpeg"
            onChange={(event) => updateLogo(event.currentTarget.files?.[0])}
          />
        </label>
        {props.logoDataUrl && (
          <button
            type="button"
            class="secondary-button"
            onClick={() => props.onChange("")}
          >
            Remove
          </button>
        )}
      </div>
      <div class="logo-preview-box">
        {props.logoDataUrl
          ? <img src={props.logoDataUrl} alt="Uploaded logo" />
          : <span>{props.fallback}</span>}
      </div>
    </section>
  );
}
