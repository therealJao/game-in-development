# verificação leve de sintaxe Luau: balanceamento de blocos e delimitadores
import sys,re
def strip(src):
    out=[];i=0;n=len(src)
    while i<n:
        c=src[i]
        if src.startswith('--[',i):
            m=re.match(r'--\[(=*)\[',src[i:])
            if m:
                end=src.find(']'+m.group(1)+']',i); out.append('\n'*src[i:end].count('\n')); i=end+len(m.group(1))+2; continue
        if src.startswith('--',i):
            j=src.find('\n',i); j=n if j<0 else j; i=j; continue
        if c=='[' and re.match(r'\[(=*)\[',src[i:]):
            m=re.match(r'\[(=*)\[',src[i:]); end=src.find(']'+m.group(1)+']',i); out.append('""'+'\n'*src[i:end].count('\n')); i=end+len(m.group(1))+2; continue
        if c in '"\'`':
            j=i+1
            while j<n and src[j]!=c:
                if src[j]=='\\': j+=1
                if src[j]=='\n' and c!='`': raise SyntaxError('string não fechada linha %d'%(src[:i].count('\n')+1))
                j+=1
            out.append('""'); i=j+1; continue
        out.append(c); i+=1
    return ''.join(out)
def check(fn):
    s=strip(open(fn,encoding='utf8').read())
    stack=[]
    toks=re.finditer(r'[A-Za-z_][A-Za-z0-9_]*|[(){}\[\]]|\n',s)
    line=1;prev=None
    for t in toks:
        w=t.group()
        if w=='\n': line+=1; continue
        if w in('function','if','do','repeat','('):
            stack.append((w,line))
        elif w in ('for','while'):
            stack.append((w,line))
        elif w=='{' or w=='[': stack.append((w,line))
        elif w=='then':
            if not stack or stack[-1][0] not in('if','elseif'): return f'{fn}:{line}: then sem if'
        elif w=='do' : pass
        elif w=='end':
            if not stack or stack[-1][0] not in('function','if','do','for!','while!'): return f'{fn}:{line}: end inesperado (topo {stack[-1] if stack else None})'
            stack.pop()
        elif w=='until':
            if not stack or stack[-1][0]!='repeat': return f'{fn}:{line}: until'
            stack.pop()
        elif w in ')}]':
            o={')':'(','}':'{',']':'['}[w]
            if not stack or stack[-1][0]!=o: return f'{fn}:{line}: {w} sem {o} (topo {stack[-1] if stack else None})'
            stack.pop()
        # 'for'/'while' consome o 'do' seguinte
        if w=='do' and len(stack)>=2 and stack[-1][0]=='do' and stack[-2][0] in('for','while') and not stack[-2][0].endswith('!'):
            stack.pop(); f=stack.pop(); stack.append((f[0]+'!',f[1]))
        prev=w
    # normaliza
    if stack: return f'{fn}: blocos abertos {stack[-3:]}'
    return None
bad=0
for fn in sys.argv[1:]:
    try: r=check(fn)
    except SyntaxError as e: r=f'{fn}: {e}'
    if r: print(r); bad+=1
print('OK' if not bad else f'{bad} com erro')
