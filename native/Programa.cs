// Aplicativo Windows: lê a pasta dist ao lado do mesmo Escape-Code.exe.
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Drawing;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Text;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
[assembly: AssemblyTitle("Escape Code — Modo História 3D")]
[assembly: AssemblyDescription("Jogo educacional 3D — Axel, Pug e as Backrooms")]
[assembly: AssemblyVersion("2.25.0.0")]
[assembly: AssemblyFileVersion("2.25.0.0")]
internal static class Programa
{
  internal static string PastaConteudo;
  internal static string PastaDados;
  internal static bool TesteInicializacao;
  internal static string CaminhoResultado;
  internal static string LevelTeste;
  internal static string CaminhoCaptura;
  internal static string InstanteTeste;
  internal static string PastaSprites;
  internal static string PastaFonte;
  internal static string[] ArgumentosIniciais;
  internal static bool GpuCompativel;
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  private static extern bool SetDllDirectory(string path);
  private static Stream AbrirPacote() {
    var arquivo=new FileStream(Assembly.GetExecutingAssembly().Location,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete);
    if(arquivo.Length>=16) {
      arquivo.Seek(-16,SeekOrigin.End);var rodape=new byte[16];arquivo.Read(rodape,0,16);
      long inicio=BitConverter.ToInt64(rodape,8);
      if(Encoding.ASCII.GetString(rodape,0,8)=="ECPK2424" && inicio>0 && inicio<arquivo.Length-16)
        return new SegmentoPacote(arquivo,inicio,arquivo.Length-inicio-16);
    }
    arquivo.Dispose();return Assembly.GetExecutingAssembly().GetManifestResourceStream("EscapeCode.Payload");
  }
  [STAThread]
  private static void Main(string[] args)
  {
    try
    {
      ArgumentosIniciais=args;
      GpuCompativel=Array.IndexOf(args,"--compat-gpu")>=0;
      if(GpuCompativel)Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS","--use-angle=swiftshader --enable-unsafe-swiftshader");
      for(int i=0;i<args.Length-1;i++)if(args[i]=="--compat-parent") {
        int pid; if(Int32.TryParse(args[i+1],out pid))try { System.Diagnostics.Process.GetProcessById(pid).WaitForExit(10000); }catch(ArgumentException){}
      }
      TesteInicializacao=Array.IndexOf(args,"--smoke-test")>=0;
      string baseDir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"EscapeCode3D","2.15");
      for(int i=0;i<args.Length-1;i++)
      {
        if(args[i]=="--data-dir")baseDir=Path.GetFullPath(args[i+1]);
        if(args[i]=="--sprite-dir")PastaSprites=Path.GetFullPath(args[i+1]);
        if(TesteInicializacao && args[i]=="--source-dir")PastaFonte=Path.GetFullPath(args[i+1]);
        if(args[i]=="--test-level")LevelTeste=args[i+1];
        if(args[i]=="--result")CaminhoResultado=Path.GetFullPath(args[i+1]);
        if(args[i]=="--capture-test")CaminhoCaptura=Path.GetFullPath(args[i+1]);
        if(args[i]=="--test-time") { double t; if(Double.TryParse(args[i+1],System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out t)&&t>=0&&t<300)InstanteTeste=t.ToString(System.Globalization.CultureInfo.InvariantCulture); }
      }
      PastaDados=baseDir;
      PastaConteudo=Path.Combine(baseDir,"content");
      Directory.CreateDirectory(PastaConteudo);
      using(Stream stream=AbrirPacote())
      using(var archive=new ZipArchive(stream,ZipArchiveMode.Read))
      {
        foreach(var entry in archive.Entries)
        {
          if(PastaFonte!=null && (entry.FullName.StartsWith("game/")||entry.FullName.StartsWith("game\\")))continue;
          string destination=Path.GetFullPath(Path.Combine(PastaConteudo,entry.FullName.Replace('/',Path.DirectorySeparatorChar)));
          if(!destination.StartsWith(Path.GetFullPath(PastaConteudo)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Caminho inválido no pacote.");
          if(entry.FullName.EndsWith("/")||entry.FullName.EndsWith("\\")) {
            Directory.CreateDirectory(destination);
            continue;
          }
          Directory.CreateDirectory(Path.GetDirectoryName(destination));
          using(var input=entry.Open())using(var output=new FileStream(destination,FileMode.Create,FileAccess.Write))input.CopyTo(output);
        }
      }
      AppDomain.CurrentDomain.AssemblyResolve+=(sender,eventArgs)=>
      {
        string name=new AssemblyName(eventArgs.Name).Name;
        if(name=="Microsoft.Web.WebView2.Core"||name=="Microsoft.Web.WebView2.WinForms")return Assembly.LoadFrom(Path.Combine(PastaConteudo,name+".dll"));
        return null;
      }
      ;
      SetDllDirectory(PastaConteudo);
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      ExecutarJanela();
    }
    catch(Exception error)
    {
      if(CaminhoResultado!=null)File.WriteAllText(CaminhoResultado,"ERROR: "+error.ToString());
      if(!TesteInicializacao)MessageBox.Show("Não foi possível iniciar Escape Code.\n\n"+error.Message+"\n\nO aplicativo precisa do Microsoft Edge WebView2 Runtime instalado no Windows.","Escape Code",MessageBoxButtons.OK,MessageBoxIcon.Error);
      Environment.ExitCode=1;
    }
  }
  [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
  private static void ExecutarJanela() {
    Application.Run(new JanelaDoJogo());
  }
}
internal sealed class SegmentoPacote:Stream {
  private readonly Stream origem;private readonly long inicio,tamanho;
  internal SegmentoPacote(Stream fonte,long offset,long length){origem=fonte;inicio=offset;tamanho=length;origem.Position=inicio;}
  public override bool CanRead{get{return true;}}public override bool CanSeek{get{return true;}}public override bool CanWrite{get{return false;}}
  public override long Length{get{return tamanho;}}public override long Position{get{return origem.Position-inicio;}set{if(value<0||value>tamanho)throw new IOException("Posição fora do pacote.");origem.Position=inicio+value;}}
  public override int Read(byte[] buffer,int offset,int count){return origem.Read(buffer,offset,(int)Math.Min(count,tamanho-Position));}
  public override long Seek(long offset,SeekOrigin origin){Position=(origin==SeekOrigin.Begin?0:origin==SeekOrigin.Current?Position:tamanho)+offset;return Position;}
  public override void Flush(){}public override void SetLength(long value){throw new NotSupportedException();}public override void Write(byte[] buffer,int offset,int count){throw new NotSupportedException();}
  protected override void Dispose(bool disposing){if(disposing)origem.Dispose();base.Dispose(disposing);}
}
internal sealed class JanelaDoJogo:Form
{
  private readonly WebView2 navegador;
  private readonly Timer tempoLimite;
  private bool pronto;
  private bool telaCheia;
  public JanelaDoJogo()
  {
    Text="Escape Code — Modo História 3D";
    Icon=System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);
    BackColor=Color.FromArgb(8,11,10);
    MinimumSize=new Size(960,640);
    Size=new Size(1440,900);
    StartPosition=FormStartPosition.CenterScreen;
    WindowState=FormWindowState.Maximized;
    KeyPreview=true;
    navegador=new WebView2();
    navegador.Dock=DockStyle.Fill;
    navegador.DefaultBackgroundColor=BackColor;
    Controls.Add(navegador);
    tempoLimite=new Timer();
    tempoLimite.Interval=90000;
    tempoLimite.Tick+=(s,e)=> {
      tempoLimite.Stop();
      if(!pronto) {
        if(Programa.CaminhoResultado!=null)File.WriteAllText(Programa.CaminhoResultado,"ERROR: tempo excedido ao carregar WebGL.");
        if(Programa.TesteInicializacao) {
          Environment.ExitCode=2;
          Close();
        }
      }
    }
    ;
    tempoLimite.Start();
    Shown+=async(s,e)=>await Inicializar();
    KeyDown+=(s,e)=> {
      if(e.KeyCode==Keys.F11) {
        AlternarTelaCheia();
        e.Handled=true;
      }
    }
    ;
  }
  private async Task Inicializar()
  {
    try
    {
      var options=new CoreWebView2EnvironmentOptions();
      var environment=await CoreWebView2Environment.CreateAsync(null,Path.Combine(Programa.PastaDados,"profile"),options);
      await navegador.EnsureCoreWebView2Async(environment);
      navegador.CoreWebView2.Settings.AreDefaultContextMenusEnabled=false;
      navegador.CoreWebView2.Settings.AreDevToolsEnabled=false;
      navegador.CoreWebView2.Settings.IsStatusBarEnabled=false;
      navegador.CoreWebView2.Settings.IsZoomControlEnabled=false;
      // Prefer the editable source beside this EXE. Reopening reads saved changes.
      string editableFolder=Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),"dist");
      string gameFolder=File.Exists(Path.Combine(editableFolder,"index.html"))?editableFolder:Path.Combine(Programa.PastaConteudo,"game");
      if(Programa.TesteInicializacao && Programa.PastaFonte!=null)gameFolder=Programa.PastaFonte;
      await navegador.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.DiskCache);
      navegador.CoreWebView2.SetVirtualHostNameToFolderMapping("escape-code.local",gameFolder,CoreWebView2HostResourceAccessKind.DenyCors);
      navegador.CoreWebView2.NewWindowRequested+=(s,e)=>e.Handled=true;
      navegador.CoreWebView2.NavigationStarting+=(s,e)=> {
        if(!e.Uri.StartsWith("https://escape-code.local/",StringComparison.OrdinalIgnoreCase)&&e.Uri!="about:blank")e.Cancel=true;
      }
      ;
      navegador.CoreWebView2.WebMessageReceived+=async (s,e)=> {
        string message=e.WebMessageAsJson;
        if(message.Contains("\"render-error\"") && message.Contains("Shader 3D:") && !Programa.GpuCompativel) {
          pronto=true;tempoLimite.Stop();
          var argumentos=new List<string>();
          foreach(string argumento in Programa.ArgumentosIniciais)argumentos.Add("\""+argumento.Replace("\"","\\\"")+"\"");
          argumentos.Add("--compat-gpu");argumentos.Add("--compat-parent");argumentos.Add(System.Diagnostics.Process.GetCurrentProcess().Id.ToString());
          var inicio=new System.Diagnostics.ProcessStartInfo(Assembly.GetExecutingAssembly().Location,String.Join(" ",argumentos));
          inicio.UseShellExecute=false;inicio.CreateNoWindow=true;inicio.WindowStyle=System.Diagnostics.ProcessWindowStyle.Hidden;
          System.Diagnostics.Process.Start(inicio);Close();return;
        }
        if(Programa.TesteInicializacao && Programa.PastaSprites!=null && message.Contains("\"sprite-export\"")) {
          var nome=System.Text.RegularExpressions.Regex.Match(message,"\"nome\"\\s*:\\s*\"(personagens[.]png|bola[.]png)\"");
          var dados=System.Text.RegularExpressions.Regex.Match(message,"\"png\"\\s*:\\s*\"data:image/png;base64,([A-Za-z0-9+/=]+)\"");
          if(nome.Success && dados.Success) { Directory.CreateDirectory(Programa.PastaSprites); File.WriteAllBytes(Path.Combine(Programa.PastaSprites,nome.Groups[1].Value),Convert.FromBase64String(dados.Groups[1].Value)); }
          return;
        }
        if(Programa.TesteInicializacao && Programa.PastaSprites!=null && message.Contains("\"sprites-ready\"")) { Close(); return; }
        if(message.Contains("\"fullscreen\"")) {
          BeginInvoke((Action)AlternarTelaCheia);
        }
        if(message.Contains("\"render-error\"")&&Programa.TesteInicializacao) {
          if(Programa.CaminhoResultado!=null)File.WriteAllText(Programa.CaminhoResultado,"ERROR: "+message);
          pronto=true;tempoLimite.Stop();Environment.ExitCode=3;Close();return;
        }
        if(message.Contains("\"qr-lido\"")&&Programa.CaminhoResultado!=null)File.AppendAllText(Programa.CaminhoResultado,"\n"+message);
        if(message.Contains("\"ready\"")) {
          pronto=true;
          tempoLimite.Stop();
          if(Programa.CaminhoResultado!=null)File.WriteAllText(Programa.CaminhoResultado,"OK: cena 3D carregada de "+gameFolder+". "+message);
          if(Programa.TesteInicializacao) {
            if(Programa.PastaSprites!=null) { await navegador.CoreWebView2.ExecuteScriptAsync("window.exportarSpritesVolei()"); return; }
            if(Programa.CaminhoCaptura!=null) {
              try { await Task.Delay(2000); using(var captura=new FileStream(Programa.CaminhoCaptura,FileMode.Create,FileAccess.Write))await navegador.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,captura); }
              catch(Exception erroCaptura) { if(Programa.CaminhoResultado!=null)File.AppendAllText(Programa.CaminhoResultado," ERROR captura: "+erroCaptura.Message);Environment.ExitCode=4; }
            }
            Close();
          }
        }
      }
      ;
      navegador.CoreWebView2.Navigate("https://escape-code.local/index.html"+(String.IsNullOrEmpty(Programa.LevelTeste)?"":"?teste="+Uri.EscapeDataString(Programa.LevelTeste)+(Programa.InstanteTeste==null?"":"&instante="+Programa.InstanteTeste)+(Programa.CaminhoCaptura==null?"":"&captura=1")));
    }
    catch(Exception error)
    {
      if(Programa.CaminhoResultado!=null)File.WriteAllText(Programa.CaminhoResultado,"ERROR: "+error.ToString());
      if(Programa.TesteInicializacao) {
        Environment.ExitCode=1;
        Close();
      }
      else MessageBox.Show(this,error.Message+"\n\nVerifique se o Microsoft Edge WebView2 Runtime está instalado.","Escape Code",MessageBoxButtons.OK,MessageBoxIcon.Error);
    }
  }
  private void AlternarTelaCheia() {
    telaCheia=!telaCheia;
    FormBorderStyle=telaCheia?FormBorderStyle.None:FormBorderStyle.Sizable;
    WindowState=FormWindowState.Maximized;
  }
  protected override void OnFormClosed(FormClosedEventArgs e) {
    tempoLimite.Dispose();
    navegador.Dispose();
    base.OnFormClosed(e);
  }
}



