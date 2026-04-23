type Item = {
  name: string;
  color: string;
  total: number;
};

export function DonutChart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  if (!total) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        Нет данных за период
      </div>
    );
  }

  let passed = 0;
  const segments = items
    .map((item) => {
      const share = (item.total / total) * 100;
      const segment = `${item.color} ${passed}% ${passed + share}%`;
      passed += share;
      return segment;
    })
    .join(", ");

  return (
    <div style={{ display: "grid", placeItems: "center", paddingTop: 4, paddingBottom: 4 }}>
      <div
        style={{
          width: 286,
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          background: `conic-gradient(${segments})`
        }}
      />
    </div>
  );
}
