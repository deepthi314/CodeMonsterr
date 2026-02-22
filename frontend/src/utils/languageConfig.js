// Language configuration: id, label, accent color, hello-world placeholder
export const LANGUAGES = [
    {
        id: 'python',
        label: 'Python',
        accent: '#3b82f6',
        icon: '🐍',
        placeholder: `# Python Hello World
x = 10
y = 20
result = x + y
print(f"Hello, World! {x} + {y} = {result}")

def greet(name):
    message = f"Hello, {name}!"
    return message

greeting = greet("CodeMonster")
print(greeting)
`,
    },
    {
        id: 'javascript',
        label: 'JavaScript',
        accent: '#eab308',
        icon: '⚡',
        placeholder: `// JavaScript Hello World
const x = 10;
const y = 20;
const result = x + y;
console.log("Hello, World! " + x + " + " + y + " = " + result);

function greet(name) {
  const message = "Hello, " + name + "!";
  return message;
}

const greeting = greet("CodeMonster");
console.log(greeting);
`,
    },
    {
        id: 'java',
        label: 'Java',
        accent: '#f97316',
        icon: '☕',
        placeholder: `// Java Hello World (single class)
public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int result = x + y;
        System.out.println("Hello, World! " + x + " + " + y + " = " + result);

        String greeting = greet("CodeMonster");
        System.out.println(greeting);
    }

    static String greet(String name) {
        String message = "Hello, " + name + "!";
        return message;
    }
}
`,
    },
    {
        id: 'cpp',
        label: 'C++',
        accent: '#a855f7',
        icon: '⚙️',
        placeholder: `// C++ Hello World
#include <iostream>
#include <string>
using namespace std;

string greet(string name) {
    string message = "Hello, " + name + "!";
    return message;
}

int main() {
    int x = 10;
    int y = 20;
    int result = x + y;
    cout << "Hello, World! " << x << " + " << y << " = " << result << endl;

    string greeting = greet("CodeMonster");
    cout << greeting << endl;
    return 0;
}
`,
    },
]

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.id, l]))

export const COMPILATION_LANGS = new Set(['java', 'cpp'])
