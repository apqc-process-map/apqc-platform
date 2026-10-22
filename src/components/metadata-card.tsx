export type MetadataOrigin = "system" | "controlled" | "user" | "inherited" | "relationship" | "derived";

export type MetadataProperty = {
  key: string;
  label: string;
  value: string | number | string[] | null | undefined;
  required?: boolean;
  origin?: MetadataOrigin;
  help?: string;
};

export type MetadataGroup = {
  key: string;
  title: string;
  description?: string;
  properties: MetadataProperty[];
};

const originLabels: Record<MetadataOrigin, string> = {
  system: "Hệ thống",
  controlled: "Danh mục",
  user: "Người nhập",
  inherited: "Kế thừa",
  relationship: "Liên kết",
  derived: "Suy ra",
};

export function hasMetadataValue(value: MetadataProperty["value"]) {
  if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
  if (typeof value === "number") return true;
  return Boolean(value?.trim());
}

function MetadataValue({ property }: { property: MetadataProperty }) {
  if (!hasMetadataValue(property.value)) {
    return <span className="process-property-missing"><span aria-hidden="true">!</span> Thiếu dữ liệu</span>;
  }
  if (Array.isArray(property.value)) {
    return <ul className="process-property-values">{property.value.map((item, index) => <li key={item + index}>{item}</li>)}</ul>;
  }
  return <span>{property.value}</span>;
}

type Props = {
  objectType: string;
  className: string;
  groups: MetadataGroup[];
  testId?: string;
};

export default function MetadataCard({ objectType, className, groups, testId = "metadata-card" }: Props) {
  const properties = groups.flatMap((group) => group.properties);
  const requiredProperties = properties.filter((property) => property.required);
  const completedRequired = requiredProperties.filter((property) => hasMetadataValue(property.value)).length;
  const missingRequired = requiredProperties.length - completedRequired;
  const completionPercent = requiredProperties.length ? Math.round((completedRequired / requiredProperties.length) * 100) : 100;

  return <div className="process-metadata-card" data-testid={testId}>
    <div className="process-metadata-context" aria-label="Ngữ cảnh metadata">
      <span><small>Object Type</small><strong>{objectType}</strong></span><b aria-hidden="true">›</b><span><small>Class</small><strong>{className}</strong></span><b aria-hidden="true">›</b><span><small>Property</small><strong>Value / Lookup</strong></span>
    </div>
    <div className="process-metadata-health">
      <div><strong>{completionPercent}%</strong><span>{completedRequired}/{requiredProperties.length} trường bắt buộc đã có dữ liệu</span></div>
      <span className={missingRequired ? "is-incomplete" : "is-complete"}>{missingRequired ? `${missingRequired} trường bắt buộc còn thiếu` : "Metadata bắt buộc đầy đủ"}</span>
      <div className="process-metadata-progress" role="progressbar" aria-label="Mức độ hoàn thiện metadata bắt buộc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}><i style={{ width: `${completionPercent}%` }} /></div>
    </div>
    <div className="process-metadata-groups">
      {groups.map((group) => {
        const missing = group.properties.filter((property) => property.required && !hasMetadataValue(property.value)).length;
        return <details className="process-metadata-group" key={group.key} open>
          <summary><div><h3>{group.title}</h3>{group.description ? <p>{group.description}</p> : null}</div><span className={missing ? "has-missing" : "is-complete"}>{missing ? `${missing} bắt buộc thiếu` : "Đủ trường bắt buộc"}</span></summary>
          <dl>
            {group.properties.map((property) => {
              const empty = !hasMetadataValue(property.value);
              return <div className={`process-property-row${empty ? " is-missing" : ""}`} key={property.key} data-metadata-state={empty ? "missing" : "complete"}>
                <dt>{property.label}<span className="metadata-property-flags">{property.required ? <small className="is-required">Bắt buộc</small> : null}{property.origin ? <small>{originLabels[property.origin]}</small> : null}</span>{property.help ? <em>{property.help}</em> : null}</dt>
                <dd><MetadataValue property={property} /></dd>
              </div>;
            })}
          </dl>
        </details>;
      })}
    </div>
  </div>;
}