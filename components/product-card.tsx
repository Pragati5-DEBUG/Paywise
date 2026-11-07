import Image from "next/image";
import Link from "next/link";
import { lowestOfferPrice, type CatalogProduct } from "@/lib/catalog";
import { usd } from "@/lib/utils";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const price = lowestOfferPrice(product);
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-stone-400"
    >
      <div className="relative h-52 bg-stone-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain p-1.5 transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-end px-4 py-3 text-sm text-stone-500">
            {product.category}
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        {product.brand && product.brand !== "Brand" ? (
          <p className="text-xs uppercase tracking-wide text-stone-500">{product.brand}</p>
        ) : null}
        <h3 className="font-medium leading-snug text-stone-900 group-hover:underline">
          {product.title}
        </h3>
        <p className="pt-2 text-lg font-semibold">
          {price == null ? "See offers" : usd(price)}
        </p>
      </div>
    </Link>
  );
}
