"""The Java program, expressed for the mini assembler:

class MainActivity extends Activity {
  WebView wv;
  onCreate(b): super.onCreate(b); requestWindowFeature(1); window flags + bar colours;
               wv = new WebView(this); settings (JS, DOM storage, textZoom 100);
               setOverScrollMode(NEVER); setWebChromeClient(new Chrome(this));
               setContentView(wv); wv.loadUrl("file:///android_asset/index.html")
  onBackPressed(): wv.evaluateJavascript("window.SB&&SB.back()", null)
}
class Chrome extends WebChromeClient {
  Activity a;
  onReceivedTitle(v, t): "__exit__" -> a.finish();  "#RRGGBBL|D" -> bar colours + icon contrast
}
"""
from dex import ClassDef, Method, build

PKG = 'Lcom/superbank/app/'
MAIN = PKG + 'MainActivity;'
CHROME = PKG + 'Chrome;'
ACT = 'Landroid/app/Activity;'
WV = 'Landroid/webkit/WebView;'
WS = 'Landroid/webkit/WebSettings;'
WIN = 'Landroid/view/Window;'
VIEW = 'Landroid/view/View;'
STR = 'Ljava/lang/String;'
WCC = 'Landroid/webkit/WebChromeClient;'
F_WV = (MAIN, 'wv', WV)
INTENT = 'Landroid/content/Intent;'
SR = 'Landroid/speech/SpeechRecognizer;'
RL = 'Landroid/speech/RecognitionListener;'
VL = PKG + 'VoiceListener;'
F_SR = (MAIN, 'sr', SR)
F_M = (VL, 'm', MAIN)
BUNDLE = 'Landroid/os/Bundle;'
AL = 'Ljava/util/ArrayList;'
F_A = (CHROME, 'a', ACT)


def make_dex(bg=0xFFECEEF8, url='file:///android_asset/index.html'):
    main = ClassDef(MAIN, ACT)
    main.fields.append(('wv', WV, 0x2))
    main.methods.append(Method(MAIN, '<init>', 'V', [], 0x10001, 1, [
        ('invoke-direct', [0], (ACT, '<init>', 'V', [])),
        ('return-void',),
    ]))
    # regs: v0 v1 v2 | p0=v3 p1=v4
    main.methods.append(Method(MAIN, 'onCreate', 'V', ['Landroid/os/Bundle;'], 0x1, 5, [
        ('invoke-super', [3, 4], (ACT, 'onCreate', 'V', ['Landroid/os/Bundle;'])),
        ('const/4', 0, 1),
        ('invoke-virtual', [3, 0], (ACT, 'requestWindowFeature', 'Z', ['I'])),
        ('invoke-virtual', [3], (ACT, 'getWindow', WIN, [])),
        ('move-result-object', 0),
        ('const', 2, 0x80000000),
        ('invoke-virtual', [0, 2], (WIN, 'addFlags', 'V', ['I'])),
        ('const', 1, bg),
        ('invoke-virtual', [0, 1], (WIN, 'setStatusBarColor', 'V', ['I'])),
        ('invoke-virtual', [0, 1], (WIN, 'setNavigationBarColor', 'V', ['I'])),
        ('new-instance', 2, 'Landroid/graphics/drawable/ColorDrawable;'),
        ('invoke-direct', [2, 1], ('Landroid/graphics/drawable/ColorDrawable;', '<init>', 'V', ['I'])),
        ('invoke-virtual', [0, 2], (WIN, 'setBackgroundDrawable', 'V', ['Landroid/graphics/drawable/Drawable;'])),
        ('new-instance', 0, WV),
        ('invoke-direct', [0, 3], (WV, '<init>', 'V', ['Landroid/content/Context;'])),
        ('iput-object', 0, 3, F_WV),
        ('invoke-virtual', [0, 1], (WV, 'setBackgroundColor', 'V', ['I'])),
        ('invoke-virtual', [0], (WV, 'getSettings', WS, [])),
        ('move-result-object', 2),
        ('const/4', 1, 1),
        ('invoke-virtual', [2, 1], (WS, 'setJavaScriptEnabled', 'V', ['Z'])),
        ('invoke-virtual', [2, 1], (WS, 'setDomStorageEnabled', 'V', ['Z'])),
        ('const/16', 1, 100),
        ('invoke-virtual', [2, 1], (WS, 'setTextZoom', 'V', ['I'])),
        ('const/4', 1, 2),
        ('invoke-virtual', [0, 1], (WV, 'setOverScrollMode', 'V', ['I'])),
        ('new-instance', 1, CHROME),
        ('invoke-direct', [1, 3], (CHROME, '<init>', 'V', [ACT])),
        ('invoke-virtual', [0, 1], (WV, 'setWebChromeClient', 'V', [WCC])),
        ('invoke-virtual', [3, 0], (ACT, 'setContentView', 'V', [VIEW])),
        ('const-string', 1, url),
        ('invoke-virtual', [0, 1], (WV, 'loadUrl', 'V', [STR])),
        ('return-void',),
    ]))
    # regs: v0 v1 v2 | p0=v3
    main.methods.append(Method(MAIN, 'onBackPressed', 'V', [], 0x1, 4, [
        ('iget-object', 0, 3, F_WV),
        ('const-string', 1, 'window.SB&&SB.back()'),
        ('const/4', 2, 0),
        ('invoke-virtual', [0, 1, 2], (WV, 'evaluateJavascript', 'V', [STR, 'Landroid/webkit/ValueCallback;'])),
        ('return-void',),
    ]))

    main.methods.append(Method(MAIN, 'onActivityResult', 'V', ['I', 'I', INTENT], 0x1, 8, [
        ('const-string', 0, 'window.SB&&SB.voice(null)'),
        ('const/4', 1, -1),
        ('if-ne', 6, 1, 'send'),
        ('if-eqz', 7, 'send'),
        ('const-string', 1, 'android.speech.extra.RESULTS'),
        ('invoke-virtual', [7, 1], (INTENT, 'getStringArrayListExtra', 'Ljava/util/ArrayList;', [STR])),
        ('move-result-object', 1),
        ('if-eqz', 1, 'send'),
        ('invoke-virtual', [1], ('Ljava/util/ArrayList;', 'isEmpty', 'Z', [])),
        ('move-result', 2),
        ('if-nez', 2, 'send'),
        ('const/4', 2, 0),
        ('invoke-virtual', [1, 2], ('Ljava/util/ArrayList;', 'get', 'Ljava/lang/Object;', ['I'])),
        ('move-result-object', 1),
        ('check-cast', 1, STR),
        ('invoke-static', [1], ('Lorg/json/JSONObject;', 'quote', STR, [STR])),
        ('move-result-object', 1),
        ('const-string', 0, 'window.SB&&SB.voice('),
        ('invoke-virtual', [0, 1], (STR, 'concat', STR, [STR])),
        ('move-result-object', 0),
        ('const-string', 1, ')'),
        ('invoke-virtual', [0, 1], (STR, 'concat', STR, [STR])),
        ('move-result-object', 0),
        ('label', 'send'),
        ('iget-object', 1, 4, F_WV),
        ('const/4', 2, 0),
        ('invoke-virtual', [1, 0, 2], (WV, 'evaluateJavascript', 'V', [STR, 'Landroid/webkit/ValueCallback;'])),
        ('return-void',),
    ]))

    main.fields.append(('sr', SR, 0x2))
    JS = (MAIN, 'js', 'V', [STR])
    # js(String): regs v0 v1 | p0=v2 p1=v3
    main.methods.append(Method(MAIN, 'js', 'V', [STR], 0x1, 4, [
        ('iget-object', 0, 2, F_WV),
        ('const/4', 1, 0),
        ('invoke-virtual', [0, 3, 1], (WV, 'evaluateJavascript', 'V', [STR, 'Landroid/webkit/ValueCallback;'])),
        ('return-void',),
    ]))
    # listen(): regs v0 v1 v2 | p0=v3
    main.methods.append(Method(MAIN, 'listen', 'V', [], 0x1, 4, [
        ('const-string', 0, 'android.permission.RECORD_AUDIO'),
        ('invoke-virtual', [3, 0], (ACT, 'checkSelfPermission', 'I', [STR])),
        ('move-result', 1),
        ('if-eqz', 1, 'granted'),
        ('const/4', 1, 1),
        ('new-array', 2, 1, '[Ljava/lang/String;'),
        ('const/4', 1, 0),
        ('aput-object', 0, 2, 1),
        ('const/16', 1, 9),
        ('invoke-virtual', [3, 2, 1], (ACT, 'requestPermissions', 'V', ['[Ljava/lang/String;', 'I'])),
        ('return-void',),
        ('label', 'granted'),
        ('invoke-virtual', [3], (MAIN, 'startRec', 'V', [])),
        ('return-void',),
    ]))
    # startRec(): regs v0..v3 | p0=v4
    main.methods.append(Method(MAIN, 'startRec', 'V', [], 0x1, 5, [
        ('invoke-static', [4], (SR, 'isRecognitionAvailable', 'Z', ['Landroid/content/Context;'])),
        ('move-result', 0),
        ('if-nez', 0, 'ok'),
        ('const-string', 0, "window.SB&&SB.vr('unavailable')"),
        ('invoke-virtual', [4, 0], JS),
        ('return-void',),
        ('label', 'ok'),
        ('iget-object', 0, 4, F_SR),
        ('if-nez', 0, 'have'),
        ('invoke-static', [4], (SR, 'createSpeechRecognizer', SR, ['Landroid/content/Context;'])),
        ('move-result-object', 0),
        ('iput-object', 0, 4, F_SR),
        ('new-instance', 1, VL),
        ('invoke-direct', [1, 4], (VL, '<init>', 'V', [MAIN])),
        ('invoke-virtual', [0, 1], (SR, 'setRecognitionListener', 'V', [RL])),
        ('label', 'have'),
        ('new-instance', 1, INTENT),
        ('const-string', 2, 'android.speech.action.RECOGNIZE_SPEECH'),
        ('invoke-direct', [1, 2], (INTENT, '<init>', 'V', [STR])),
        ('const-string', 2, 'android.speech.extra.LANGUAGE_MODEL'),
        ('const-string', 3, 'free_form'),
        ('invoke-virtual', [1, 2, 3], (INTENT, 'putExtra', INTENT, [STR, STR])),
        ('const-string', 2, 'android.speech.extra.PARTIAL_RESULTS'),
        ('const/4', 3, 1),
        ('invoke-virtual', [1, 2, 3], (INTENT, 'putExtra', INTENT, [STR, 'Z'])),
        ('invoke-virtual', [0, 1], (SR, 'startListening', 'V', [INTENT])),
        ('return-void',),
    ]))
    # stopListen / cancelListen: regs v0 | p0=v1
    for nm, call in (('stopListen', 'stopListening'), ('cancelListen', 'cancel')):
        main.methods.append(Method(MAIN, nm, 'V', [], 0x1, 2, [
            ('iget-object', 0, 1, F_SR),
            ('if-eqz', 0, 'r'),
            ('invoke-virtual', [0], (SR, call, 'V', [])),
            ('label', 'r'),
            ('return-void',),
        ]))
    # onRequestPermissionsResult(I,[String,[I): regs v0 v1 | p0=v2 p1=v3 p2=v4 p3=v5
    main.methods.append(Method(MAIN, 'onRequestPermissionsResult', 'V', ['I', '[Ljava/lang/String;', '[I'], 0x1, 6, [
        ('array-length', 0, 5),
        ('if-eqz', 0, 'deny'),
        ('const/4', 1, 0),
        ('aget', 0, 5, 1),
        ('if-nez', 0, 'deny'),
        ('invoke-virtual', [2], (MAIN, 'startRec', 'V', [])),
        ('return-void',),
        ('label', 'deny'),
        ('const-string', 0, "window.SB&&SB.vr('denied')"),
        ('invoke-virtual', [2, 0], JS),
        ('return-void',),
    ]))

    vl = ClassDef(VL, 'Ljava/lang/Object;')
    vl.interfaces.append(RL)
    vl.fields.append(('m', MAIN, 0x2))
    vl.methods.append(Method(VL, '<init>', 'V', [MAIN], 0x10001, 2, [
        ('invoke-direct', [0], ('Ljava/lang/Object;', '<init>', 'V', [])),
        ('iput-object', 1, 0, F_M),
        ('return-void',),
    ]))
    def simple(name, params, ev):
        n = len(params)
        # regs v0 v1 | p0=v2 ...
        return Method(VL, name, 'V', params, 0x1, 3 + n, [
            ('iget-object', 0, 2, F_M),
            ('const-string', 1, "window.SB&&SB.vr('%s')" % ev),
            ('invoke-virtual', [0, 1], JS),
            ('return-void',),
        ])
    vl.methods.append(simple('onReadyForSpeech', [BUNDLE], 'ready'))
    vl.methods.append(simple('onBeginningOfSpeech', [], 'begin'))
    vl.methods.append(simple('onEndOfSpeech', [], 'end'))
    vl.methods.append(Method(VL, 'onBufferReceived', 'V', ['[B'], 0x1, 2, [('return-void',)]))
    vl.methods.append(Method(VL, 'onEvent', 'V', ['I', BUNDLE], 0x1, 3, [('return-void',)]))
    for name, ptype, ev in (('onRmsChanged', 'F', 'rms'), ('onError', 'I', 'error')):
        # regs v0 v1 | p0=v2 p1=v3
        vl.methods.append(Method(VL, name, 'V', [ptype], 0x1, 4, [
            ('invoke-static', [3], (STR, 'valueOf', STR, [ptype])),
            ('move-result-object', 1),
            ('const-string', 0, "window.SB&&SB.vr('%s'," % ev),
            ('invoke-virtual', [0, 1], (STR, 'concat', STR, [STR])),
            ('move-result-object', 0),
            ('const-string', 1, ')'),
            ('invoke-virtual', [0, 1], (STR, 'concat', STR, [STR])),
            ('move-result-object', 0),
            ('iget-object', 1, 2, F_M),
            ('invoke-virtual', [1, 0], JS),
            ('return-void',),
        ]))
    for name, ev in (('onResults', 'final'), ('onPartialResults', 'partial')):
        # regs v0 v1 v2 | p0=v3 p1=v4
        vl.methods.append(Method(VL, name, 'V', [BUNDLE], 0x1, 5, [
            ('const-string', 0, 'results_recognition'),
            ('invoke-virtual', [4, 0], (BUNDLE, 'getStringArrayList', AL, [STR])),
            ('move-result-object', 0),
            ('const-string', 2, 'null'),
            ('if-eqz', 0, 'emit'),
            ('invoke-virtual', [0], (AL, 'isEmpty', 'Z', [])),
            ('move-result', 1),
            ('if-nez', 1, 'emit'),
            ('const/4', 1, 0),
            ('invoke-virtual', [0, 1], (AL, 'get', 'Ljava/lang/Object;', ['I'])),
            ('move-result-object', 0),
            ('check-cast', 0, STR),
            ('invoke-static', [0], ('Lorg/json/JSONObject;', 'quote', STR, [STR])),
            ('move-result-object', 2),
            ('label', 'emit'),
            ('const-string', 0, "window.SB&&SB.vr('%s'," % ev),
            ('invoke-virtual', [0, 2], (STR, 'concat', STR, [STR])),
            ('move-result-object', 0),
            ('const-string', 1, ')'),
            ('invoke-virtual', [0, 1], (STR, 'concat', STR, [STR])),
            ('move-result-object', 0),
            ('iget-object', 1, 3, F_M),
            ('invoke-virtual', [1, 0], JS),
            ('return-void',),
        ]))

    chrome = ClassDef(CHROME, WCC)
    chrome.fields.append(('a', ACT, 0x2))
    # regs: p0=v0 p1=v1
    chrome.methods.append(Method(CHROME, '<init>', 'V', [ACT], 0x10001, 2, [
        ('invoke-direct', [0], (WCC, '<init>', 'V', [])),
        ('iput-object', 1, 0, F_A),
        ('return-void',),
    ]))
    # regs: v0..v3 | p0=v4 p1=v5 p2=v6
    chrome.methods.append(Method(CHROME, 'onReceivedTitle', 'V', [WV, STR], 0x1, 7, [
        ('if-eqz', 6, 'ret'),
        ('iget-object', 0, 4, F_A),
        ('const-string', 1, '__exit__'),
        ('invoke-virtual', [6, 1], (STR, 'equals', 'Z', ['Ljava/lang/Object;'])),
        ('move-result', 1),
        ('if-eqz', 1, 'notexit'),
        ('invoke-virtual', [0], (ACT, 'finish', 'V', [])),
        ('return-void',),
        ('label', 'notexit'),
        ('const-string', 1, '__voice__'),
        ('invoke-virtual', [6, 1], (STR, 'equals', 'Z', ['Ljava/lang/Object;'])),
        ('move-result', 1),
        ('if-eqz', 1, 'notvoice'),
        ('new-instance', 1, INTENT),
        ('const-string', 2, 'android.speech.action.RECOGNIZE_SPEECH'),
        ('invoke-direct', [1, 2], (INTENT, '<init>', 'V', [STR])),
        ('const-string', 2, 'android.speech.extra.LANGUAGE_MODEL'),
        ('const-string', 3, 'free_form'),
        ('invoke-virtual', [1, 2, 3], (INTENT, 'putExtra', INTENT, [STR, STR])),
        ('const-string', 2, 'android.speech.extra.PROMPT'),
        ('const-string', 3, 'Ask OneFI'),
        ('invoke-virtual', [1, 2, 3], (INTENT, 'putExtra', INTENT, [STR, STR])),
        ('invoke-virtual', [0], (ACT, 'getPackageManager', 'Landroid/content/pm/PackageManager;', [])),
        ('move-result-object', 2),
        ('invoke-virtual', [1, 2], (INTENT, 'resolveActivity', 'Landroid/content/ComponentName;', ['Landroid/content/pm/PackageManager;'])),
        ('move-result-object', 2),
        ('if-eqz', 2, 'novoice'),
        ('const/16', 2, 7),
        ('invoke-virtual', [0, 1, 2], (ACT, 'startActivityForResult', 'V', [INTENT, 'I'])),
        ('return-void',),
        ('label', 'novoice'),
        ('const-string', 2, 'window.SB&&SB.voice(null,1)'),
        ('const/4', 3, 0),
        ('invoke-virtual', [5, 2, 3], (WV, 'evaluateJavascript', 'V', [STR, 'Landroid/webkit/ValueCallback;'])),
        ('return-void',),
        ('label', 'notvoice'),
        ('const-string', 1, '__listen__'),
        ('invoke-virtual', [6, 1], (STR, 'equals', 'Z', ['Ljava/lang/Object;'])),
        ('move-result', 1),
        ('if-eqz', 1, 'notlisten'),
        ('check-cast', 0, MAIN),
        ('invoke-virtual', [0], (MAIN, 'listen', 'V', [])),
        ('return-void',),
        ('label', 'notlisten'),
        ('const-string', 1, '__stoplisten__'),
        ('invoke-virtual', [6, 1], (STR, 'equals', 'Z', ['Ljava/lang/Object;'])),
        ('move-result', 1),
        ('if-eqz', 1, 'notstop'),
        ('check-cast', 0, MAIN),
        ('invoke-virtual', [0], (MAIN, 'stopListen', 'V', [])),
        ('return-void',),
        ('label', 'notstop'),
        ('const-string', 1, '__cancellisten__'),
        ('invoke-virtual', [6, 1], (STR, 'equals', 'Z', ['Ljava/lang/Object;'])),
        ('move-result', 1),
        ('if-eqz', 1, 'notcancel'),
        ('check-cast', 0, MAIN),
        ('invoke-virtual', [0], (MAIN, 'cancelListen', 'V', [])),
        ('return-void',),
        ('label', 'notcancel'),
        ('invoke-virtual', [6], (STR, 'length', 'I', [])),
        ('move-result', 1),
        ('const/16', 2, 8),
        ('if-ne', 1, 2, 'ret'),
        ('const/4', 1, 0),
        ('invoke-virtual', [6, 1], (STR, 'charAt', 'C', ['I'])),
        ('move-result', 1),
        ('const/16', 2, 35),
        ('if-ne', 1, 2, 'ret'),
        ('const/4', 1, 0),
        ('const/4', 2, 7),
        ('invoke-virtual', [6, 1, 2], (STR, 'substring', STR, ['I', 'I'])),
        ('move-result-object', 1),
        ('invoke-static', [1], ('Landroid/graphics/Color;', 'parseColor', 'I', [STR])),
        ('move-result', 1),
        ('invoke-virtual', [0], (ACT, 'getWindow', WIN, [])),
        ('move-result-object', 0),
        ('invoke-virtual', [0, 1], (WIN, 'setStatusBarColor', 'V', ['I'])),
        ('invoke-virtual', [0, 1], (WIN, 'setNavigationBarColor', 'V', ['I'])),
        ('invoke-virtual', [0], (WIN, 'getDecorView', VIEW, [])),
        ('move-result-object', 0),
        ('invoke-virtual', [6, 2], (STR, 'charAt', 'C', ['I'])),
        ('move-result', 1),
        ('const/16', 2, 76),
        ('const/4', 3, 0),
        ('if-ne', 1, 2, 'set'),
        ('const/16', 3, 0x2010),
        ('label', 'set'),
        ('invoke-virtual', [0, 3], (VIEW, 'setSystemUiVisibility', 'V', ['I'])),
        ('label', 'ret'),
        ('return-void',),
    ]))
    return build([main, chrome, vl])


if __name__ == '__main__':
    d = make_dex()
    open('/home/claude/superbank/build/classes.dex', 'wb').write(d)
    print(len(d))
