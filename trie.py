class Trie:
    def __init__(self, n):
        self.n = n  # name
        self.c = {}  # children
        self.l = False  # is leaf
        self.length = 0

    def push(self, string):
        self.length += 1
        n = string[0]
        if n not in self.c:
            self.c[n] = Trie(n)
        if len(string) > 1:
            self.c[n].push(string[1:])
        else:
            self.c[n].l = True

    def contains(self, string):
        if len(string) == 1:
            if string in self.c:
                if self.c[string].l:
                    return 2
                else:
                    return 1
            else:
                return 0
        
        if string[0] in self.c:
            return self.c[string[0]].contains(string[1:])
        else:
            return 0

    def display(self):
        s = ""
        if self.l:
            s += "_"
        s += self.n
        if len(self.c) > 0:
            s += "["
            for c in self.c.values():
                s += c.display()
                s += ","
            s = s[:-1] + "]"
        return s

    def __str__(self):
        return str(self.__dict__)