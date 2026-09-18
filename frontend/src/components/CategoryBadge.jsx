export default function CategoryBadge({ category }) {
  if (!category) return null;
  return <p className="cat-label">{category}</p>;
}
