"""Tiny pandas stand-in covering only what the notebook uses (local testing without pandas)."""
import numpy as np


class Index(list):
    def tolist(self): return list(self)


class _ILoc:
    def __init__(self, s): self.s = s
    def __getitem__(self, i): return self.s.values[i]


class Series:
    def __init__(self, values, index=None):
        self.values = list(values)
        self.index = Index(index if index is not None else range(len(self.values)))
    def tolist(self): return list(self.values)
    def __len__(self): return len(self.values)
    def __iter__(self): return iter(self.values)
    @property
    def iloc(self): return _ILoc(self)
    def items(self): return zip(self.index, self.values)
    def value_counts(self):
        c = {}
        for v in self.values: c[v] = c.get(v, 0) + 1
        pairs = sorted(c.items(), key=lambda kv: -kv[1])
        return Series([v for _, v in pairs], [k for k, _ in pairs])
    def isin(self, xs): return Series([v in xs for v in self.values], self.index)
    def __invert__(self): return Series([not v for v in self.values], self.index)
    def __lt__(self, o): return Series([v < o for v in self.values], self.index)
    def __getitem__(self, mask):
        if isinstance(mask, Series): mask = mask.values
        return Series([v for v, m in zip(self.values, mask) if m], [i for i, m in zip(self.index, mask) if m])


class DataFrame:
    def __init__(self, data):
        if isinstance(data, dict):
            self.rows = [dict(zip(data, vals)) for vals in zip(*data.values())]
        else:
            self.rows = [dict(r) for r in data]
    def __len__(self): return len(self.rows)
    def __getitem__(self, key):
        if isinstance(key, str): return Series([r.get(key) for r in self.rows])
        if isinstance(key, list) and key and isinstance(key[0], str):
            return DataFrame([{k: r.get(k) for k in key} for r in self.rows])
        mask = key.values if isinstance(key, Series) else list(np.asarray(key))
        return DataFrame([r for r, m in zip(self.rows, mask) if m])
    def reset_index(self, drop=True): return DataFrame(self.rows)
    def to_dict(self, orient="records"): return [dict(r) for r in self.rows]
    def assign(self, **cols):
        return DataFrame([{**r, **{k: v[i] for k, v in cols.items()}} for i, r in enumerate(self.rows)])
    def to_string(self): return "\n".join(str(r) for r in self.rows)
