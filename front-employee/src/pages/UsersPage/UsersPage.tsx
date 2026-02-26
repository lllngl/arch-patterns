import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/api/users";
import type { UsersFilterParams } from "@/api/users";
import type { Page, UserDTO } from "@/types";
import { CreateUserDialog } from "./CreateUserDialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Сотрудник",
  CLIENT: "Клиент",
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Page<UserDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [emailFilter, setEmailFilter] = useState("");
  const [blockedFilter, setBlockedFilter] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UsersFilterParams = {
        page,
        size: PAGE_SIZE,
        sortBy: "id",
        sortDir: "ASC",
      };
      if (emailFilter.trim()) params.email = emailFilter.trim();
      if (blockedFilter !== "all") params.isBlocked = blockedFilter === "true";
      const { data } = await usersApi.getAll(params);
      setData(data);
    } catch {
      toast.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  }, [page, emailFilter, blockedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch() {
    setPage(0);
    fetchUsers();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Пользователи</h1>
        <CreateUserDialog onCreated={fetchUsers} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по email"
            className="pl-8"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select
          value={blockedFilter}
          onValueChange={(v) => {
            setBlockedFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="false">Активные</SelectItem>
            <SelectItem value="true">Заблокированные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((user) => {
                const fullName = [
                  user.lastName,
                  user.firstName,
                  user.patronymic,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone ? `+${user.phone}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">Заблокирован</Badge>
                      ) : (
                        <Badge variant="secondary">Активен</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {data.number + 1} из {data.totalPages} (всего{" "}
            {data.totalElements})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft /> Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
