import { useState } from "react";
import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tariffsApi } from "@/api/tariffs";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import axios from "axios";
import { localizeError } from "@/lib/error-messages";

interface CreateTariffDialogProps {
  onCreated: () => void;
}

export function CreateTariffDialog({ onCreated }: CreateTariffDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [minTerm, setMinTerm] = useState("");
  const [maxTerm, setMaxTerm] = useState("");

  function resetForm() {
    setName("");
    setRate("");
    setMinAmount("");
    setMaxAmount("");
    setMinTerm("");
    setMaxTerm("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await tariffsApi.create({
        name,
        rate: Number(rate),
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        minTermMonths: Number(minTerm),
        maxTermMonths: Number(maxTerm),
      });
      toast.success("Тариф создан");
      setOpen(false);
      resetForm();
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(localizeError(err.response?.data?.message));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Создать тариф
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый кредитный тариф</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">Название *</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              placeholder="Потребительский"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-rate">Процентная ставка (0.00 – 1.00) *</Label>
            <Input
              id="ct-rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              placeholder="0.12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-minAmt">Мин. сумма *</Label>
              <Input
                id="ct-minAmt"
                type="number"
                step="0.01"
                min="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                required
                placeholder="10000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-maxAmt">Макс. сумма *</Label>
              <Input
                id="ct-maxAmt"
                type="number"
                step="0.01"
                min="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                required
                placeholder="1000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-minTerm">Мин. срок (мес.) *</Label>
              <Input
                id="ct-minTerm"
                type="number"
                min="1"
                value={minTerm}
                onChange={(e) => setMinTerm(e.target.value)}
                required
                placeholder="3"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-maxTerm">Макс. срок (мес.) *</Label>
              <Input
                id="ct-maxTerm"
                type="number"
                min="1"
                value={maxTerm}
                onChange={(e) => setMaxTerm(e.target.value)}
                required
                placeholder="60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
