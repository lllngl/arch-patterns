import { useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuthStore } from "@/stores/auth";
import { usersApi } from "@/api/users";
import { toast } from "sonner";
import { Loader2, Pencil, X } from "lucide-react";
import type { Gender } from "@/types";
import { getErrorMessage } from "@/lib/http-error";
import { RoleBadges } from "@/components/custom/RoleBadges";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Мужской",
  FEMALE: "Женский",
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [birthDate, setBirthDate] = useState("");

  if (!user) return null;

  function startEditing() {
    setFirstName(user!.firstName);
    setLastName(user!.lastName);
    setPatronymic(user!.patronymic ?? "");
    setEmail(user!.email);
    setPhone(user!.phone ? String(user!.phone) : "");
    setGender(user!.gender as Gender);
    setBirthDate(user!.birthDate ?? "");
    setEditing(true);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.update(user!.id, {
        firstName,
        lastName,
        patronymic: patronymic || undefined,
        phone: phone ? Number(phone) : undefined,
        gender,
        birthDate: birthDate || undefined,
      });
      await fetchUser();
      setEditing(false);
      toast.success("Профиль обновлён");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const fullName = [user.lastName, user.firstName, user.patronymic]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Личные данные</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil /> Редактировать
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ep-lastName">Фамилия</Label>
                  <Input
                    id="ep-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={85}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ep-firstName">Имя</Label>
                  <Input
                    id="ep-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={85}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ep-patronymic">Отчество</Label>
                <Input
                  id="ep-patronymic"
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                  maxLength={85}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ep-email">Email</Label>
                  <Input id="ep-email" type="email" value={email} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ep-phone">Телефон</Label>
                  <Input
                    id="ep-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="79001234567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Пол</Label>
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
                  <Label htmlFor="ep-birth">Дата рождения</Label>
                  <Input
                    id="ep-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  <X /> Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">ФИО</span>
              <span>{fullName}</span>

              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>

              <span className="text-muted-foreground">Телефон</span>
              <span>{user.phone ? `+${user.phone}` : "—"}</span>

              <span className="text-muted-foreground">Пол</span>
              <span>{GENDER_LABELS[user.gender] ?? user.gender}</span>

              <span className="text-muted-foreground">Дата рождения</span>
              <span>
                {user.birthDate
                  ? new Date(user.birthDate).toLocaleDateString("ru-RU")
                  : "—"}
              </span>

              <span className="text-muted-foreground">Роли</span>
              <span>
                <RoleBadges roles={user.roles} variant="secondary" />
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
