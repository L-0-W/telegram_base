import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Save, Loader2 } from "lucide-react"

export function Settings() {
    const [apiId, setApiId] = useState("")
    const [apiHash, setApiHash] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState({ text: "", type: "" })

    // Telegram Auth State
    const [phoneNumber, setPhoneNumber] = useState("")
    const [phoneCode, setPhoneCode] = useState("")
    const [phoneCodeHash, setPhoneCodeHash] = useState("")
    const [isCodeSent, setIsCodeSent] = useState(false)
    const [isTelegramAuthorized, setIsTelegramAuthorized] = useState(false)
    const [isTelegramLoading, setIsTelegramLoading] = useState(false)
    const [telegramMessage, setTelegramMessage] = useState({ text: "", type: "" })

    useEffect(() => {
        const fetchConfig = async () => {
            const token = localStorage.getItem("admin_auth_token");
            try {
                const response = await fetch("http://localhost:3000/api/config", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setApiId(data.apiId || "");
                    setApiHash(data.apiHash || "");
                }

                // Check Telegram Status
                const statusRes = await fetch("http://localhost:3000/api/auth/telegram/status", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setIsTelegramAuthorized(statusData.authorized);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        setMessage({ text: "", type: "" });
        const token = localStorage.getItem("admin_auth_token");

        try {
            const response = await fetch("http://localhost:3000/api/config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ apiId, apiHash }),
            });

            if (response.ok) {
                setMessage({ text: "Configuração salva com sucesso!", type: "success" });
            } else {
                setMessage({ text: "Erro ao salvar a configuração.", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Erro de rede ao salvar.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTelegramCode = async () => {
        if (!phoneNumber) return;
        setIsTelegramLoading(true);
        setTelegramMessage({ text: "", type: "" });
        const token = localStorage.getItem("admin_auth_token");

        try {
            const response = await fetch("http://localhost:3000/api/auth/telegram/send-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ phoneNumber }),
            });

            const data = await response.json();
            if (response.ok) {
                setPhoneCodeHash(data.phoneCodeHash);
                setIsCodeSent(true);
                setTelegramMessage({ text: "Código enviado ao seu Telegram!", type: "success" });
            } else {
                setTelegramMessage({ text: data.error || "Erro ao enviar código.", type: "error" });
            }
        } catch (err) {
            setTelegramMessage({ text: "Erro de rede.", type: "error" });
        } finally {
            setIsTelegramLoading(false);
        }
    };

    const handleTelegramLogin = async () => {
        if (!phoneCode) return;
        setIsTelegramLoading(true);
        const token = localStorage.getItem("admin_auth_token");

        try {
            const response = await fetch("http://localhost:3000/api/auth/telegram/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ phoneNumber, phoneCodeHash, code: phoneCode }),
            });

            const data = await response.json();
            if (response.ok) {
                setIsTelegramAuthorized(true);
                setTelegramMessage({ text: "Login realizado com sucesso! Sessão salva.", type: "success" });
            } else {
                setTelegramMessage({ text: data.error || "Erro no login.", type: "error" });
            }
        } catch (err) {
            setTelegramMessage({ text: "Erro de rede.", type: "error" });
        } finally {
            setIsTelegramLoading(false);
        }
    };

    const handleTelegramLogout = async () => {
        setIsTelegramLoading(true);
        const token = localStorage.getItem("admin_auth_token");

        try {
            const response = await fetch("http://localhost:3000/api/auth/telegram/logout", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setIsTelegramAuthorized(false);
                setPhoneNumber("");
                setPhoneCode("");
                setIsCodeSent(false);
                setTelegramMessage({ text: "Sessão encerrada.", type: "success" });
            }
        } catch (err) {
            console.error("Failed to logout", err);
        } finally {
            setIsTelegramLoading(false);
        }
    };

    const handleDownloadConfig = () => {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const endpoint = `${protocol}//${host}/api`;

        const config = { endpoint };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "config.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações do Sistema</h1>
                <p className="text-muted-foreground">
                    Gerencie as configurações do seu painel e gere arquivos de configuração.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* API Configs */}
                <div className="p-6 border border-border/40 rounded-xl bg-[#09090b]/40 backdrop-blur-sm shadow-sm space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Credenciais da API</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configurações `api_id` e `api_hash` do Telegram.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="api-id">App api_id</Label>
                            <Input
                                id="api-id"
                                placeholder="Ex: 123456"
                                value={apiId}
                                onChange={(e) => setApiId(e.target.value)}
                                disabled={isLoading || isSaving}
                                className="bg-transparent/50 border-input/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-hash">App api_hash</Label>
                            <Input
                                id="api-hash"
                                placeholder="Ex: abcd1234..."
                                value={apiHash}
                                onChange={(e) => setApiHash(e.target.value)}
                                disabled={isLoading || isSaving}
                                className="bg-transparent/50 border-input/50"
                            />
                        </div>

                        {message.text && (
                            <p className={`text-sm font-medium ${message.type === 'error' ? 'text-destructive' : 'text-green-500'}`}>
                                {message.text}
                            </p>
                        )}

                        <Button
                            onClick={handleSaveConfig}
                            disabled={isLoading || isSaving}
                            className="gap-2 w-full"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar Credenciais
                        </Button>
                    </div>
                </div>

                {/* Telegram Session */}
                <div className="p-6 border border-border/40 rounded-xl bg-[#09090b]/40 backdrop-blur-sm shadow-sm space-y-4">
                    <div>
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-semibold">Sessão do Telegram</h2>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isTelegramAuthorized ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                {isTelegramAuthorized ? 'Conectado' : 'Aguardando Login'}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Autentique sua conta para persistir a sessão do robô.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        {!isTelegramAuthorized ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Número de Telefone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+5511999999999"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        disabled={isTelegramLoading || isCodeSent}
                                        className="bg-transparent/50 border-input/50"
                                    />
                                </div>

                                {isCodeSent && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="code">Código de Segurança</Label>
                                        <Input
                                            id="code"
                                            placeholder="12345"
                                            value={phoneCode}
                                            onChange={(e) => setPhoneCode(e.target.value)}
                                            disabled={isTelegramLoading}
                                            className="bg-transparent/50 border-input/50"
                                        />
                                    </div>
                                )}

                                {telegramMessage.text && (
                                    <p className={`text-sm font-medium ${telegramMessage.type === 'error' ? 'text-destructive' : 'text-green-500'}`}>
                                        {telegramMessage.text}
                                    </p>
                                )}

                                {!isCodeSent ? (
                                    <Button
                                        onClick={handleSendTelegramCode}
                                        disabled={isTelegramLoading || !phoneNumber}
                                        className="gap-2 w-full"
                                        variant="secondary"
                                    >
                                        {isTelegramLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Enviar Código
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleTelegramLogin}
                                        disabled={isTelegramLoading || !phoneCode}
                                        className="gap-2 w-full"
                                    >
                                        {isTelegramLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Confirmar Login
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 space-y-3">
                                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <div className="h-6 w-6 rounded-full bg-green-500" />
                                </div>
                                <p className="text-sm text-center text-muted-foreground px-4">
                                    Sua conta do Telegram está vinculada e a sessão está ativa.
                                </p>
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={handleTelegramLogout}
                                    disabled={isTelegramLoading}
                                >
                                    {isTelegramLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Sair da Conta
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 border border-border/40 rounded-xl bg-[#09090b]/40 backdrop-blur-sm shadow-sm space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Exportar Configuração</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gere o arquivo de configuração contendo o endpoint apontando para este painel.
                    </p>
                </div>

                <Button onClick={handleDownloadConfig} className="gap-2" variant="outline">
                    <Download className="h-4 w-4" />
                    Gerar arquivo configuração
                </Button>
            </div>
        </div>
    )
}
