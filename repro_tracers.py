
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path("f:/CodeMonster1.0/backend").resolve()))

from tracers import cpp_tracer, python_tracer

cpp_code = """
#include <bits/stdc++.h>
using namespace std;

void dfs(int node, vector<int> adj[], vector<int>& vis, stack<int>& st) {
    vis[node] = 1;
    for(auto it : adj[node]) {
        if(!vis[it]) {
            dfs(it, adj, vis, st);
        }
    }
    st.push(node);
}

vector<int> topoSort(int V, vector<int> adj[]) {
    vector<int> vis(V, 0);
    stack<int> st;
    for(int i = 0; i < V; i++) {
        if(!vis[i]) {
            dfs(i, adj, vis, st);
        }
    }
    vector<int> topo;
    while(!st.empty()) {
        topo.push_back(st.top());
        st.pop();
    }
    return topo;
}

int main() {
    int V = 6;
    vector<int> adj[6];
    adj[5].push_back(2);
    adj[5].push_back(0);
    adj[4].push_back(0);
    adj[4].push_back(1);
    adj[2].push_back(3);
    adj[3].push_back(1);

    vector<int> ans = topoSort(V, adj);
    for(auto it : ans) {
        cout << it << " ";
    }
    return 0;
}
"""

python_code = """
import collections

def solve():
    adj = collections.defaultdict(list)
    adj[5].extend([2, 0])
    adj[4].extend([0, 1])
    adj[2].append(3)
    adj[3].append(1)
    
    vis = [False] * 6
    st = []
    
    def dfs(node):
        vis[node] = True
        for it in adj[node]:
            if not vis[it]:
                dfs(it)
        st.append(node)
        
    for i in range(6):
        if not vis[i]:
            dfs(i)
    
    return st[::-1]

print(solve())
"""

def test_cpp():
    print("Testing C++ Tracer...")
    # Mock environment for GDB
    os.environ["GPP_PATH"] = "C:\\MinGW\\bin\\g++.exe"
    os.environ["GDB_PATH"] = "C:\\MinGW\\bin\\gdb.exe"
    
    steps = cpp_tracer.trace(cpp_code)
    print(f"Captured {len(steps)} steps.")
    for i, step in enumerate(steps[:10]):
        print(f"Step {step['step_number']}: L{step['line_number']} in {step['scope']} - {step['line_text']}")
    
    # Check if we entered topoSort
    topo_entered = any("topoSort" in step['scope'] for step in steps)
    print(f"Entered topoSort: {topo_entered}")
    
    # Check if we entered dfs
    dfs_entered = any("dfs" in step['scope'] for step in steps)
    print(f"Entered dfs: {dfs_entered}")

def test_python():
    print("\nTesting Python Tracer...")
    steps = python_tracer.trace(python_code)
    print(f"Captured {len(steps)} steps.")
    for i, step in enumerate(steps[:10]):
        print(f"Step {step['step_number']}: L{step['line_number']} in {step['scope']} - {step['line_text']}")
    
    # Check for output
    has_output = any(step['output'] for step in steps)
    print(f"Has output: {has_output}")

if __name__ == "__main__":
    test_cpp()
    test_python()
