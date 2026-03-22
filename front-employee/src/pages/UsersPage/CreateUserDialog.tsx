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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/api/users";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import type { Gender, RoleName } from "@/types";
import { getErrorMessage } from "@/lib/http-error";

interface CreateUserDialogProps {
  onCreated: () => void;
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [roles, setRoles] = useState<RoleName[]>(["CLIENT"]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPatronymic("");
    setEmail("");
    setPhone("");
    setPassword("");
    setBirthDate("");
    setGender("MALE");
    setRoles(["CLIENT"]);
  }

  function toggleRole(roleName: RoleName) {
    setRoles((currentRoles) =>
      currentRoles.includes(roleName)
        ? currentRoles.filter((value) => value !== roleName)
        : [...currentRoles, roleName]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await usersApi.create(
        {
          firstName,
          lastName,
          patronymic: patronymic || undefined,
          email,
          phone: phone ? Number(phone) : undefined,
          password,
          birthDate,
          gender,
        },
        roles
      );
      toast.success("Пользователь создан");
      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Создать пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый пользователь</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cu-lastName">Фамилия *</Label>
              <Input
                id="cu-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={85}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-firstName">Имя *</Label>
              <Input
                id="cu-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={85}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-patronymic">Отчество</Label>
            <Input
              id="cu-patronymic"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              maxLength={85}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email *</Label>
              <Input
                id="cu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-phone">Телефон *</Label>
              <Input
                id="cu-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                required
                placeholder="79001234567"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Пароль *</Label>
            <Input
              id="cu-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cu-birthDate">Дата рождения *</Label>
              <Input
                id="cu-birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Пол *</Label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(v as Gender)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Мужской</SelectItem>
                  <SelectItem value="FEMALE">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Роли *</Label>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={roles.includes("CLIENT") ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => toggleRole("CLIENT")}
                >
                  Клиент
                </Button>
                <Button
                  type="button"
                  variant={roles.includes("EMPLOYEE") ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => toggleRole("EMPLOYEE")}
                >
                  Сотрудник
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Можно выбрать сразу несколько ролей.
              </p>
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
            <Button type="submit" disabled={loading || roles.length === 0}>
              {loading && <Loader2 className="animate-spin" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
