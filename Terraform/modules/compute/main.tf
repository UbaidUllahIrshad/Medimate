
resource "aws_key_pair" "medimate_auth" {
    key_name = "medimate_key"
    public_key = file(var.public_key_path)

  
}

resource "aws_instance" "medimate_instance" {
  instance_type = var.instance_type
  ami= var.ami_id
  key_name = aws_key_pair.medimate_auth.key_name
  vpc_security_group_ids = [var.security_group_id]
  subnet_id=var.subnet_id
  user_data = file(var.user_data_path)

  tags ={
    Name="Medimate_instnace"
  }

  root_block_device {
    volume_size = var.volume_size
  }

  provisioner "local-exec" {
    command = templatefile("${path.root}/${var.host_os}-ssh-config.tpl", {
      hostname     = self.public_ip
      user         = "ubuntu"
      identityfile = var.private_key_path
    })
}
}



