import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, Navigate } from "react-router-dom";
import { Users, Mail, TrendingUp, Edit, Save, Plus, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateToken } from "@/lib/tokens";

const ADMIN_KEY = "amor2025";

const AdminOculto = () => {
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  const { toast } = useToast();
  
  const [invitados, setInvitados] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);

  useEffect(() => {
    if (key === ADMIN_KEY) {
      loadInvitados();
    }
  }, [key]);

  const loadInvitados = async () => {
    try {
      const response = await fetch("/data/invitados.json");
      const data = await response.json();
      setInvitados(data);
    } catch (error) {
      console.error("Error loading invitados:", error);
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number) => {
    setEditingId(null);
    toast({
      title: "Guardado",
      description: "Los cambios se han guardado correctamente",
    });
    // Aquí iría la lógica para guardar en el JSON
  };

  const handleGenerateToken = (id: number) => {
    const newToken = generateToken();
    const updatedInvitados = invitados.map(inv =>
      inv.id === id ? { ...inv, token: newToken } : inv
    );
    setInvitados(updatedInvitados);
    toast({
      title: "Token generado",
      description: `Nuevo token: ${newToken}`,
    });
  };

  const handleSendInvitation = (invitado: any) => {
    const invitationLink = `${window.location.origin}/rsvp?token=${invitado.token}`;
    
    // Copiar link al portapapeles
    navigator.clipboard.writeText(invitationLink).then(() => {
      setCopiedTokenId(invitado.id);
      setTimeout(() => setCopiedTokenId(null), 3000);
      
      toast({
        title: "Link de invitación copiado",
        description: `Puedes enviarlo a ${invitado.nombre} por email o WhatsApp`,
      });
    }).catch(() => {
      toast({
        title: "Link generado",
        description: invitationLink,
        variant: "destructive",
      });
    });
  };

  const handleAddInvitado = () => {
    const nuevoInvitado = {
      id: Math.max(...invitados.map(i => i.id), 0) + 1,
      nombre: "Nuevo invitado",
      email: "",
      pareja: false,
      hijos: 0,
      token: generateToken(),
      asistencia: "pendiente",
      acompanantes: 0,
    };
    setInvitados([...invitados, nuevoInvitado]);
    setEditingId(nuevoInvitado.id);
  };

  const stats = {
    total: invitados.length,
    confirmados: invitados.filter(i => i.asistencia === "confirmado").length,
    pendientes: invitados.filter(i => i.asistencia === "pendiente").length,
    rechazados: invitados.filter(i => i.asistencia === "rechazado").length,
    totalAsistentes: invitados
      .filter(i => i.asistencia === "confirmado")
      .reduce((sum, i) => sum + 1 + i.acompanantes, 0),
  };

  if (key !== ADMIN_KEY) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="font-playfair text-5xl font-bold mb-4">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestiona tus invitados y confirmaciones
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.confirmados}</div>
              <div className="text-sm text-muted-foreground">Confirmados</div>
            </div>
            
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendientes}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{stats.rechazados}</div>
              <div className="text-sm text-muted-foreground">Rechazados</div>
            </div>
            
            <div className="bg-gradient-gold rounded-xl shadow-gold p-6 text-center text-white">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{stats.totalAsistentes}</div>
              <div className="text-sm opacity-90">Asistentes</div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 mb-8"
          >
            <Button onClick={handleAddInvitado} className="shadow-gold">
              <Plus className="mr-2 w-4 h-4" />
              Añadir invitado
            </Button>
            <Button variant="outline" onClick={() => setShowStats(!showStats)}>
              <TrendingUp className="mr-2 w-4 h-4" />
              {showStats ? "Ocultar" : "Ver"} estadísticas
            </Button>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pareja</TableHead>
                    <TableHead>Hijos</TableHead>
                    <TableHead>Asistencia</TableHead>
                    <TableHead>Acompañantes</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitados.map((invitado) => {
                    const isEditing = editingId === invitado.id;
                    
                    return (
                      <TableRow key={invitado.id}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              defaultValue={invitado.nombre}
                              className="h-8"
                            />
                          ) : (
                            invitado.nombre
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              defaultValue={invitado.email}
                              type="email"
                              className="h-8"
                            />
                          ) : (
                            invitado.email
                          )}
                        </TableCell>
                        <TableCell>{invitado.pareja ? "Sí" : "No"}</TableCell>
                        <TableCell>{invitado.hijos}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invitado.asistencia === "confirmado"
                                ? "default"
                                : invitado.asistencia === "rechazado"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {invitado.asistencia}
                          </Badge>
                        </TableCell>
                        <TableCell>{invitado.acompanantes}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {invitado.token}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <Button
                                size="sm"
                                onClick={() => handleSave(invitado.id)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(invitado.id)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateToken(invitado.id)}
                                  title="Generar nuevo token"
                                >
                                  Token
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendInvitation(invitado)}
                                  title="Copiar link de invitación"
                                  className={copiedTokenId === invitado.id ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {copiedTokenId === invitado.id ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 bg-card rounded-2xl shadow-soft p-8"
            >
              <h2 className="font-playfair text-2xl font-bold mb-6">
                Estadísticas Detalladas
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Tasa de confirmación</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Confirmados</span>
                      <span className="font-bold text-green-600">
                        {((stats.confirmados / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pendientes</span>
                      <span className="font-bold text-yellow-600">
                        {((stats.pendientes / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rechazados</span>
                      <span className="font-bold text-red-600">
                        {((stats.rechazados / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Proyección de asistentes</h3>
                  <p className="text-muted-foreground mb-2">
                    Total de personas que asistirán (incluyendo acompañantes):
                  </p>
                  <div className="text-4xl font-bold text-primary">
                    {stats.totalAsistentes}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminOculto;
