import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import type { FormData } from './types';
import type { Product } from '../../types';

function calcSalePrice(purchasePrice: number, margin: number, taxRate: number): number {
  if (taxRate >= 1) return purchasePrice * (1 + margin);
  return (purchasePrice * (1 + margin)) / (1 - taxRate);
}

export function ProductRow({ index, product, availableQty, control, register, errors, purchaseDisabled }: {
  index: number;
  product: Product;
  availableQty: number;
  control: Control<FormData>;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  purchaseDisabled?: boolean;
}) {
  const margin      = useWatch({ control, name: `items.${index}.margin` });
  const salesVolume = useWatch({ control, name: `items.${index}.salesVolume` });

  register(`items.${index}.productId`);

  const marginNum     = Number(margin) || 0;
  const salePrice     = calcSalePrice(product.purchasePrice, marginNum / 100, product.taxRate);
  const volumeNum     = Number(salesVolume) || 0;
  const stockCostRow  = volumeNum * product.purchasePrice;
  const volumeWarning = volumeNum > availableQty && availableQty > 0;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Custo: {formatCurrency(product.purchasePrice)} · Imposto: {(product.taxRate * 100).toFixed(0)}%
        </p>
        <p className="text-xs text-gray-400">
          Custo do estoque: <span className="font-medium text-gray-600">{formatCurrency(stockCostRow)}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400 mb-1">Estoque</p>
        <p className="text-sm font-medium text-gray-700">{availableQty}</p>
      </div>
      <div className="w-32">
        <label className="text-xs text-gray-500 mb-1 block">Margem (%)</label>
        <input type="number" step="1" min="0"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors?.items?.[index]?.margin ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          {...register(`items.${index}.margin`)} />
        {errors?.items?.[index]?.margin && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index]?.margin?.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Ex.: 30 = 30%. Preço: {formatCurrency(salePrice)}</p>
      </div>
      <div className="w-28">
        <label className="text-xs text-gray-500 mb-1 block">Volume (un.)</label>
        {purchaseDisabled ? (
          <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-sm text-gray-500 cursor-not-allowed">
            —
          </div>
        ) : (
          <input type="number" min="1"
            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${volumeWarning ? 'border-orange-400 bg-orange-50' : errors?.items?.[index]?.salesVolume ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            {...register(`items.${index}.salesVolume`)} />
        )}
        {!purchaseDisabled && volumeWarning && <p className="text-xs text-orange-600 mt-0.5">Acima do estoque</p>}
        {!purchaseDisabled && errors?.items?.[index]?.salesVolume && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index]?.salesVolume?.message}</p>
        )}
        {purchaseDisabled && <p className="text-xs text-gray-400 mt-0.5">Sem compras</p>}
      </div>
    </div>
  );
}
