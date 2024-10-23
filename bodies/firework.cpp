#include <bits/stdc++.h>
#define int long long

using namespace std;

void solve()
{
  int n, m;
  cin >> n >> m;
  for(int i = 0; i < m; i++){
    int a, b;
    cin >> a >> b;
  }
  cout << n << " ";
  vector<int> ans;
  for(int i = 1; i <= n; i++){
    ans.push_back(i);
  }
  std::random_device rd;
  std::mt19937 g(rd());

  std::shuffle(ans.begin(), ans.end(), g);
  for(int i = 0; i < n; i++){
    cout << ans[i] << " ";
  }
  cout << "\n";
}

signed main()
{
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    int tt;
    cin >> tt;
    while (tt--)
    {
        solve();
    }
}